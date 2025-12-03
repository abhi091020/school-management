// controllers/admin/eventController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import * as eventService from "../../services/admin/eventService.js";

/* ============================================================
   GET ALL EVENTS
   - Supports includeDeleted via req.modelQuery
============================================================ */
export const getEvents = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const { events, total } = await eventService.getAllEvents({
    ...filters,
    ...req.query,
  });

  res.json({
    success: true,
    data: events,
    total,
    message: "Events fetched successfully",
  });
});

/* ============================================================
   GET EVENT BY ID
   - Supports includeDeleted via req.modelQuery
============================================================ */
export const getEventById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const event = await eventService.getEventById(req.params.id, filters);

  if (!event) throwError("Event not found", 404);

  res.json({
    success: true,
    data: event,
    message: "Event fetched successfully",
  });
});

/* ============================================================
   CREATE EVENT
============================================================ */
export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: event,
    message: "Event created successfully",
  });
});

/* ============================================================
   UPDATE EVENT
============================================================ */
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEventById(
    req.params.id,
    req.body,
    req.userId
  );

  res.json({
    success: true,
    data: event,
    message: "Event updated successfully",
  });
});

/* ============================================================
   DELETE EVENT (SOFT DELETE)
============================================================ */
export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEventById(req.params.id);

  res.json({
    success: true,
    message: "Event deleted successfully",
  });
});
