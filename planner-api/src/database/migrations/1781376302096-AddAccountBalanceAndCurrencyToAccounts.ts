import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddAccountBalanceAndCurrencyToAccounts1781376302096 implements MigrationInterface {
  name = 'AddAccountBalanceAndCurrencyToAccounts1781376302096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'balance',
        type: 'real',
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'currency',
        type: 'varchar',
        default: "'MXN'",
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'income_payments',
      new TableColumn({
        name: 'account_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'income_payments',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumn(
      'payment_period_items',
      new TableColumn({
        name: 'account_entity_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'payment_period_items',
      new TableForeignKey({
        columnNames: ['account_entity_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const ppiTable = await queryRunner.getTable('payment_period_items');
    const ppiForeignKey = ppiTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('account_entity_id') !== -1,
    );
    if (ppiForeignKey) {
      await queryRunner.dropForeignKey('payment_period_items', ppiForeignKey);
    }
    await queryRunner.dropColumn('payment_period_items', 'account_entity_id');

    const table = await queryRunner.getTable('income_payments');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('account_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('income_payments', foreignKey);
    }

    await queryRunner.dropColumn('income_payments', 'account_id');
    await queryRunner.dropColumn('accounts', 'currency');
    await queryRunner.dropColumn('accounts', 'balance');
  }
}
