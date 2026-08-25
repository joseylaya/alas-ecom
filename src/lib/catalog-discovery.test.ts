import { describe, expect, it } from "vitest";
import { products } from "../features/catalog/catalog.data";
import { searchProducts } from "./catalog-discovery";

describe("searchProducts", () => {
  it("ranks direct product-name matches first", () => {
    expect(searchProducts(products, "obsidian")[0]?.name).toBe("The Obsidian Overcoat");
  });

  it("matches useful catalog attributes across fields", () => {
    expect(searchProducts(products, "accessories leather").map((product) => product.name)).toEqual(["Architectural Leather Tote"]);
    expect(searchProducts(products, "sterling").map((product) => product.name)).toEqual(["Minimalist Silver Cuff"]);
  });

  it("requires every search term and returns no irrelevant products", () => {
    expect(searchProducts(products, "leather ceramic")).toEqual([]);
  });
});
