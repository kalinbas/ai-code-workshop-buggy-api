import { customersByToken } from "./data.js";
import { HttpError } from "./http-error.js";

export function getCurrentCustomer(headers) {
  const authorization = headers.authorization;
  if (!authorization) {
    throw new HttpError(401, "Missing Authorization header");
  }

  const match = authorization.match(/^Bearer\s+(.+)$/);
  if (!match) {
    throw new HttpError(401, "Malformed Authorization header");
  }

  const token = match[1].trim();
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
