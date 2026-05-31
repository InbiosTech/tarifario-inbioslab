import { parseIdParam } from "../utils/queryParams.js";
import {
  createPromotionRecord,
  deletePromotionRecord,
  getAdminPromotions,
  getPromotionDetail,
  getPublicPromotions,
  updatePromotionRecord,
} from "../services/promotionsService.js";

export async function listPublicPromotionsController(req, res, next) {
  try {
    const items = await getPublicPromotions(req.query);
    return res.json(items);
  } catch (error) {
    return next(error);
  }
}

export async function listAdminPromotionsController(req, res, next) {
  try {
    const response = await getAdminPromotions(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function getPromotionController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const item = await getPromotionDetail(id);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function createPromotionController(req, res, next) {
  try {
    const item = await createPromotionRecord(req.body, req.auth);
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updatePromotionController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const item = await updatePromotionRecord(id, req.body, req.auth);
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deletePromotionController(req, res, next) {
  try {
    const id = parseIdParam(req.params.id);
    const response = await deletePromotionRecord(id, req.auth);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}
