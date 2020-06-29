import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  type: string;
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    if (
      title === undefined ||
      type === undefined ||
      value === undefined ||
      category === undefined
    ) {
      throw new AppError('title, type, value or category not found', 401);
    }

    if (!(type === 'income' || type === 'outcome')) {
      throw new AppError('Type not found', 401);
    }

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && balance.total < Number(value)) {
      throw new AppError('no have balance', 400);
    }

    const categoryFind = await categoryRepository.findOne({
      where: { title: category },
    });

    const categoria = { id: '' };

    if (!categoryFind) {
      const categoryNew = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryNew);
      categoria.id = categoryNew.id;
    } else {
      categoria.id = categoryFind.id;
    }

    const transaction = await transactionRepository.create({
      category_id: categoria.id,
      value,
      title,
      type,
    });

    await transactionRepository.save(transaction);

    console.log(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
