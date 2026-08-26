import { resetDatabase } from './helpers';

// Every test starts against an empty database, so tests can run in any order
// and never depend on rows another test left behind.
beforeEach(resetDatabase);
