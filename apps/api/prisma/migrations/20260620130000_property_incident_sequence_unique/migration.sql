-- Ensure incident numbers are unique inside each property dossier.
CREATE UNIQUE INDEX IF NOT EXISTS "PropertyIncident_propertyId_sequence_key" ON "PropertyIncident"("propertyId", "sequence");
