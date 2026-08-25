import type { Product } from "../../types/catalog";

const collectionImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAUkRCauqE1WLyxyFEhBT_R_WQZh45NtILOGC-ChrDKkmNuMwimAykqzAMSv2WZzydf_wK-gem5wYkHsUJA8amKvJgCPFiYhhiYF_85bVyOTkdINWv9irEITSWTPAdKjDbkxilEcVyGpmAAhlF4l4yGPCC-NwoYiKqkzpEnqepxVnvOkoQ0SUvJ2P3nVVCKMIgRO6AyCSUDqgfWz07A_Y30UGaT4iOc7fsMBDeBMV7CfjWiWGOisWL6mw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDoX2UB-Ui5HIf6UsScNkgCh4XuWieVu4BzQzawR2KuyKCosTIQSMHZTNivS6DBHBeQ_X0UhRyCpNYiviY0LsRpiv4cVWdpKZVZX96uVzrefSF7CPJp_KqYsLwvJQX4CaPKfL7ygEMAsTFK8pfQYXtQjxF3PpZyjJ67FboXuwXNIj7kE0D-TBkFaF_-JUp_mDdCSPmmr7RuaOQ_Q032VgfaZrh0u9yl0lGjDrT1_B4uI2NTVUZOPmCUuA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDNVmlPa4DcW0i7byCSZbJfZ25xxGKHuVvittUEeM-vfrjFWaptt4qvzxZXLs_bJli2qwuA27MMpvc-7lqx79JWPqew4mlg7j7j6WDS-ZYdSL6huVMrymg9oYMNN1HurMGc7S4YUpx6M8TXat5vCBkDnk95H0fBdtMVjUwdXflCtevU4YOXdDaovxIUmOK6EYC_o-2W-iajrN5sBZYvjpRpKPMZrc_CAgi402Y5QflfQFlmYNJq8gZUyw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEN32K68QZ31titV1_YNaSDo6NhkbBlHg6GAkt7MP_KRoHuFESc6zPE5jXOPQdXbZ_GU6dzadpbPSA0sSLAbA12SHsbPNEiEJiJpj5ArJCmPXtHFtP7hxvXEzwwathMXgIq1IBpfEEOvUt4BS0Sp3OBFa1I5C8aDIaFH45ReJiJwE5gn0GK6wqGa9_vqZ70ysmBSN5P-_saKeenOIOXJoJjEC93rKnTm4aXQKTIjbcSjZ81Da95AdqBA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCIxdreAHLmb6n-nhQtUw8CweD-WIiW-ewu6ryzwnHSYQAFUCSL3O87t2vUMTYqb3KPeQcVFV-X09SfOvyl9RX_Xrixb9wy32ZtVOU-PKCnIdV4Ixq1TorqyVWB67JemC3lTPy62ccHpuInJbHKpxxGzvx1MHec88-WQ9iVlGAP4H7WHUOdsWuAg6eGaXQqCel57Dk3_64EkDUG3Hf42f1NSYddgswDCDmGcwZf5qa52kOO09xlB1jhzg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB1M8wdr-3SlNVrQxMGFMPUXNzfiGDNA3zz5LiKIdYG1gBoMeV6Rb-443pQYqPIgP9R5p7eVZMwCdtdDPbFCEaKL8Qp3FLLVMsmCHT7G5NKkXHFlPwSgzxgT6fp9r7yITkswO7w4OoeJ9gNdGRSLP5_kpJdAldMYRbhXJecbJ6DG2RamIotgPZ94HL5SBZWUC7hM9zR7X1XTWn9EE-XRfypEgNbbYVBJK0q1KuMAeDMhCXDS6tNYHtTrQ"
];
const detailGallery = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuARGuNNzjM_fQv9Q0VEbSHTbN2vLjN_6mR-mgdjeRLfXV3AYCdnYnhxlgCBiSKGniLk7Q9IFQyoPcYLmrKfIsxv2ovVK9OseAvypQM2xrFsCiaxVLRwaqQTUb9qDXr2nX2UCUlPkgwW-pViFM746EnLnqaic1Pw46h0ztO1dNHms6Pycr4d3TUnpaS8hQu30QH8DgB9TKhKx37G6XRNPWuKlBwnYr85On2S_3fM0woWu3tQdbSDzNhRBw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBds505UdamRNQhMnwH1JNw8NpfUlk4aKtbclnQ2oxIWS2YqHpCehbtPdLY9A-yQC9bl0GjrDGXqSSObD3uk-q82oB3aIz1uHeVsYfGeicILvVyS2CP7UYyqBUO6DrdmjSmQMChYaskpIcqrPghRrumtPD2tJAC815xWj3J07IRiBEjofaBuxEcp8oLmjB3kXUjeL2j_luvGeuNW6CYTNnwXX-9Du3E96JhunzMUQ8r8Cll_X-EuW59Ag",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5WDmjID40SxCiDn8so-bYxdAzxjuPr3lpDUA4HDUObdV0XJPdD24ORMGOtmpiclbrDyQTfINAphCRrkoSCqfwBd54dgoHfblGwe7uCoRCpn4QCwb1wOVZUStH_omKEAe2oqJM60L82BuYhQ0T_K0mIJiB7zqCKbP2Fo-Mt3JsZf_QkWH8uP3_9drfTCjzM1Tz0CFZYCDnJzgcc8p6-QCW2OgprEKVY4UKzOT5A7GLMJeVDDP8_cadnQ"
];

const definitions = [
  ["core-logo-tee", "The Obsidian Overcoat", "Structured wool-cashmere tailoring with a precise architectural silhouette.", 145000, "Outerwear", "Wool Cashmere"],
  ["terrain-overshirt", "Architectural Leather Tote", "A refined everyday carry in softly structured leather.", 65000, "Accessories", "Leather"],
  ["studio-cap", "Sculptural Ankle Boot", "A clean-lined leather boot made for everyday movement.", 52000, "Footwear", "Leather"],
  ["bone-vessel", "Bone Glaze Ceramic Vessel", "A quiet sculptural object finished in a warm bone glaze.", 28000, "Objects", "Ceramic"],
  ["modernist-chair", "Modernist Lounge Chair", "An enduring study in steel, textile, and proportion.", 145000, "Living", "Steel Textile"],
  ["silver-cuff", "Minimalist Silver Cuff", "Hand-finished sterling silver with a mirrored edge.", 34000, "Accessories", "Sterling Silver"]
] as const;

export const products: Product[] = definitions.map(([slug, name, description, priceCentavos, collection, material], index) => ({
  id: `c${index + 1}`, slug, name, description, image: index === 0 ? detailGallery[0] : collectionImages[index], gallery: index === 0 ? detailGallery : [collectionImages[index]], collection, material,
  variants: ["36", "38", "40", "42", "44"].map((size, variantIndex) => ({ id: `v${index * 5 + variantIndex + 1}`, size, color: index === 0 ? "Onyx Black" : "Core", sku: `ALAS-${index + 1}-${size}`, priceCentavos, stock: size === "44" && index === 0 ? 0 : 5 + variantIndex }))
}));

export const findProduct = (slug: string) => products.find((product) => product.slug === slug);
export const findVariant = (variantId: string) => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).find(({ variant }) => variant.id === variantId);
