'use client';

/**
 * Datenschutzkonforme Fehlerklasse.
 *
 * Behält die Oberfläche von FirestorePermissionError bei (ohne Firebase-Abhängigkeit),
 * damit FirestoreErrorListener unverändert funktioniert. Da alles lokal läuft, werden
 * echte Zugriffsfehler praktisch nie ausgelöst.
 */

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly request: Record<string, any>;

  constructor(context: SecurityRuleContext) {
    super(
      `Zugriff verweigert (lokal): ${context.operation} auf ${context.path}. Da die App lokal läuft, sollte dieser Fehler nicht auftreten.`
    );
    this.name = 'FirebaseError';
    this.request = {
      method: context.operation,
      path: `/local/documents/${context.path}`,
      auth: null, // kein Cloud-Auth — alles lokal
      resource: context.requestResourceData
        ? { data: context.requestResourceData }
        : undefined,
    };
  }
}
