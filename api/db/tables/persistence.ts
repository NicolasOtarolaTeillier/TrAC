import { dbAuth } from "../";

export const PERSISTENCE_TABLE = "persistence";

export interface IPersistence {
  user: string;

  key: string;

  data: Record<string, any>;
}

export const PersistenceTable = () => dbAuth<IPersistence>(PERSISTENCE_TABLE);
