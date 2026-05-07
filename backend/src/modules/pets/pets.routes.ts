import { Router } from 'express';
import { authRequired } from '../../shared/auth';
import { authOptional } from '../../shared/authOptional';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import { createPetBody, listPetsQuery, petIdParams, updatePetBody } from './pets.schema';
import * as ctrl from './pets.controller';

const router = Router();

router.get('/', validateQuery(listPetsQuery), ctrl.list);
router.get('/:id', authOptional, validateParams(petIdParams), ctrl.getById);
router.post('/', authRequired, validateBody(createPetBody), ctrl.create);
router.patch('/:id', authRequired, validateParams(petIdParams), validateBody(updatePetBody), ctrl.update);

export { router as petsRouter };

