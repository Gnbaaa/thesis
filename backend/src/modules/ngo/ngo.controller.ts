import type { Request, Response } from 'express';
import { submitNgoApplication } from './ngo.service';
import type { CreateNgoApplicationInput } from './ngo.types';

export async function createApplication(req: Request, res: Response) {
  const file = req.file;
  const input = req.body as CreateNgoApplicationInput;

  const created = await submitNgoApplication({
    user: req.user!,
    input,
    file,
  });

  res.status(201).json({ application: created });
}

