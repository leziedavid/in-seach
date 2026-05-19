import fr from "./fr.json";
import en from "./en.json";

export const translations = {
    fr,
    en,
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = typeof fr;

// Helper to get nested keys (for type safety if possible, or just string for now)
export type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TKey = NestedKeyOf<TranslationKeys>;
