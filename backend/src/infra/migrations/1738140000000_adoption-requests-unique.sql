CREATE UNIQUE INDEX IF NOT EXISTS ux_adoption_requests_pet_requester
  ON adoption_requests(pet_id, requester_id);

