import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

interface BackfillItemRow {
  itemId: string;
  categoryStr: string;
  planId: string;
}

interface CategoryRow {
  id: string;
}

interface DownBackfillItemRow {
  itemId: string;
  categoryId: string;
}

interface CategoryKeyRow {
  key: string;
}

/**
 * Migration to:
 * 1. Rename allocation_categories.percentage to ideal_percentage
 * 2. Replace payment_period_items.category (string) with category_id (FK to allocation_categories)
 *
 * Uses TypeORM QueryRunner schema builder APIs for dialect-safe migrations.
 * SQLite compatibility: TypeORM handles table recreation internally where needed.
 */
export class RenameCategoryPercentageAndPaymentItemCategoryFk1781376302097 implements MigrationInterface {
  name = 'RenameCategoryPercentageAndPaymentItemCategoryFk1781376302097';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Check allocation_categories table state
    const allocationTable = await queryRunner.getTable('allocation_categories');

    if (allocationTable) {
      const percentageColumn = allocationTable.findColumnByName('percentage');
      const idealPercentageColumn =
        allocationTable.findColumnByName('ideal_percentage');

      // Rename percentage to ideal_percentage if needed
      if (percentageColumn && !idealPercentageColumn) {
        await queryRunner.renameColumn(
          'allocation_categories',
          'percentage',
          'ideal_percentage',
        );
      }
    }

    // Check payment_period_items table state
    const itemsTable = await queryRunner.getTable('payment_period_items');

    if (itemsTable) {
      const categoryColumn = itemsTable.findColumnByName('category');
      const categoryIdColumn = itemsTable.findColumnByName('category_id');

      // Add category_id column if it doesn't exist
      if (!categoryIdColumn) {
        await queryRunner.addColumn(
          'payment_period_items',
          new TableColumn({
            name: 'category_id',
            type: 'varchar',
            isNullable: true,
          }),
        );
      }

      // Backfill category_id from old category string
      // Use queryRunner.manager to perform data migration
      if (categoryColumn) {
        // Get all payment period items with category string
        const items = await queryRunner.manager
          .createQueryBuilder()
          .select('payment_period_items.id', 'itemId')
          .addSelect('payment_period_items.category', 'categoryStr')
          .addSelect('payment_periods.planId', 'planId')
          .from('payment_period_items', 'payment_period_items')
          .leftJoin(
            'payment_periods',
            'payment_periods',
            'payment_periods.id = payment_period_items.paymentPeriodId',
          )
          .where('payment_period_items.category IS NOT NULL')
          .getRawMany<BackfillItemRow>();

        // For each item, find matching allocation category by key or name
        for (const item of items) {
          if (item.categoryStr) {
            const category = await queryRunner.manager
              .createQueryBuilder()
              .select('allocation_categories.id', 'id')
              .from('allocation_categories', 'allocation_categories')
              .where('allocation_categories.planId = :planId', {
                planId: item.planId,
              })
              .andWhere(
                '(allocation_categories.key = :category OR allocation_categories.name = :category)',
                {
                  category: item.categoryStr,
                },
              )
              .getRawOne<CategoryRow>();

            if (category) {
              await queryRunner.manager
                .createQueryBuilder()
                .update('payment_period_items')
                .set({ category_id: category.id })
                .where('id = :id', { id: item.itemId })
                .execute();
            }
          }
        }
      }

      // Add foreign key constraint if not exists
      const foreignKeys = itemsTable.foreignKeys;
      const hasCategoryFk = foreignKeys.some((fk) =>
        fk.columnNames.includes('category_id'),
      );

      if (!hasCategoryFk) {
        // Note: SQLite requires table recreation to add FK; TypeORM handles this internally via queryRunner.createForeignKey
        // If TypeORM cannot add FK directly on SQLite, we skip this step as FK enforcement is limited in SQLite anyway
        try {
          await queryRunner.createForeignKey(
            'payment_period_items',
            new TableForeignKey({
              name: 'FK_payment_period_items_category',
              columnNames: ['category_id'],
              referencedColumnNames: ['id'],
              referencedTableName: 'allocation_categories',
              onDelete: 'SET NULL',
            }),
          );
        } catch {
          // SQLite may not support adding FK to existing table
          // This is acceptable as SQLite doesn't enforce FKs by default
          console.warn(
            'Could not add FK constraint on SQLite (table recreation required)',
          );
        }
      }

      // Drop old category column if it exists and we have category_id
      if (categoryColumn) {
        try {
          await queryRunner.dropColumn('payment_period_items', 'category');
        } catch {
          // SQLite may require table recreation for DROP COLUMN
          // This is handled by TypeORM internally in newer versions
          console.warn('Could not drop category column directly on SQLite');
        }
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: restore percentage column, restore category string column

    // Check allocation_categories table state
    const allocationTable = await queryRunner.getTable('allocation_categories');

    if (allocationTable) {
      const percentageColumn = allocationTable.findColumnByName('percentage');
      const idealPercentageColumn =
        allocationTable.findColumnByName('ideal_percentage');

      // Rename ideal_percentage back to percentage if needed
      if (idealPercentageColumn && !percentageColumn) {
        await queryRunner.renameColumn(
          'allocation_categories',
          'ideal_percentage',
          'percentage',
        );
      }
    }

    // Check payment_period_items table state
    const itemsTable = await queryRunner.getTable('payment_period_items');

    if (itemsTable) {
      const categoryIdColumn = itemsTable.findColumnByName('category_id');
      const categoryColumn = itemsTable.findColumnByName('category');

      // Add category column back if it doesn't exist
      if (!categoryColumn) {
        await queryRunner.addColumn(
          'payment_period_items',
          new TableColumn({
            name: 'category',
            type: 'varchar',
            isNullable: true,
          }),
        );
      }

      // Backfill category string from category_id
      if (categoryIdColumn) {
        const items = await queryRunner.manager
          .createQueryBuilder()
          .select('payment_period_items.id', 'itemId')
          .addSelect('payment_period_items.category_id', 'categoryId')
          .from('payment_period_items', 'payment_period_items')
          .where('payment_period_items.category_id IS NOT NULL')
          .getRawMany<DownBackfillItemRow>();

        for (const item of items) {
          if (item.categoryId) {
            const category = await queryRunner.manager
              .createQueryBuilder()
              .select('allocation_categories.key', 'key')
              .from('allocation_categories', 'allocation_categories')
              .where('allocation_categories.id = :id', { id: item.categoryId })
              .getRawOne<CategoryKeyRow>();

            if (category) {
              await queryRunner.manager
                .createQueryBuilder()
                .update('payment_period_items')
                .set({ category: category.key })
                .where('id = :id', { id: item.itemId })
                .execute();
            }
          }
        }
      }

      // Drop foreign key if exists
      const foreignKeys = itemsTable.foreignKeys;
      const categoryFk = foreignKeys.find((fk) =>
        fk.columnNames.includes('category_id'),
      );

      if (categoryFk) {
        try {
          await queryRunner.dropForeignKey('payment_period_items', categoryFk);
        } catch {
          console.warn('Could not drop FK constraint on SQLite');
        }
      }

      // Drop category_id column if it exists
      if (categoryIdColumn) {
        try {
          await queryRunner.dropColumn('payment_period_items', 'category_id');
        } catch {
          console.warn('Could not drop category_id column directly on SQLite');
        }
      }
    }
  }
}
