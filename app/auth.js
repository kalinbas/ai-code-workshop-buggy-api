import { customersByToken } from "./data.js";
import { HttpError } from "./http-error.js";

export function getCurrentCustomer(headers) {
  const authorization = headers.authorization;
  // Fix: require the auth header to be a plain string before parsing it.
  if (typeof authorization !== "string" || authorization.length === 0) {
    throw new HttpError(401, "Missing Authorization header");
  }

  // Fix: parse the Bearer scheme strictly so malformed headers cannot become valid tokens.
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]+)$/);
  if (!match) {
    throw new HttpError(401, "Malformed Authorization header");
  }
  const token = match[1];
  const customer = customersByToken[token];
  if (!customer) {
    throw new HttpError(403, "Invalid token");
  }
  return customer;
}

export function requireAdmin(customer) {
  if (customer.role !== "admin") {
    throw new HttpError(403, "Admin access required");
  }
}
