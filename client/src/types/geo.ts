export interface GeoCountry {
  readonly name: string;
  readonly code: string;
  readonly currency: string;
  readonly languages: readonly string[];
  readonly localize: boolean;
  readonly proficiency: string;
}

export interface GeoSession {
  readonly country: GeoCountry | null;
  readonly localize: boolean;
}
