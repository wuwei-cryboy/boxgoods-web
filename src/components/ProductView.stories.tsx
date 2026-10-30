import type { Meta, StoryObj } from "@storybook/react";
import ProductView from "@/components/ProductView";

// Mock 数据（Storybook 环境下不连真实 API）
const mockProduct = {
  id: "demo-product",
  cat: "telephones",
  supplierId: "s1",
  image: "/img/telephones/01-main.webp",
  detailImages: ["/img/telephones/01-d01.jpg"],
  nameFr: "iPhone 15 Pro Max 256GB",
  nameZh: "iPhone 15 Pro Max 256GB",
  priceMin: 899,
  priceMax: 999,
  currency: "USD",
  moq: 10,
  boxSpec: "Carton 10 pièces",
  specs: [
    ["Écran", "6.7\" Super Retina XDR"],
    ["Puce", "A17 Pro"],
    ["Stockage", "256 Go"],
    ["Caméra", "48 MP + 12 MP + 12 MP"],
  ],
  variants: [
    { type: "color", label: "Titane Naturel", img: "/img/telephones/01-v1.webp" },
    { type: "color", label: "Titane Bleu", img: "/img/telephones/01-v2.webp" },
    { type: "color", label: "Titane Blanc", img: "/img/telephones/01-v3.webp" },
    { type: "color", label: "Titane Noir", img: "/img/telephones/01-v4.webp" },
  ],
  sellingPoint: "A17 Pro · 6,7\" · 256 Go · USB-C",
};

const meta: Meta<typeof ProductView> = {
  title: "Components/ProductView",
  component: ProductView,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "light" },
  },
  tags: ["autodocs"],
  argTypes: {
    // id 通过 URL 参数传入，这里只做演示
  },
};

export default meta;
type Story = StoryObj<typeof ProductView>;

// 基础故事：法语
export const Default: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light", colorblind: "none" },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
  render: () => <ProductView id="demo-product" />,
};

// 中文版本
export const Chinese: Story = {
  parameters: {
    globals: { locale: "zh", theme: "light", colorblind: "none" },
  },
  render: () => <ProductView id="demo-product" />,
};

// 深色模式
export const DarkMode: Story = {
  parameters: {
    globals: { locale: "fr", theme: "dark", colorblind: "none" },
  },
  render: () => <ProductView id="demo-product" />,
};

// 红色盲模式
export const Protanopia: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light", colorblind: "protanopia" },
  },
  render: () => <ProductView id="demo-product" />,
};

// 绿色盲模式
export const Deuteranopia: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light", colorblind: "deuteranopia" },
  },
  render: () => <ProductView id="demo-product" />,
};

// 全色盲模式
export const Achromatopsia: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light", colorblind: "achromatopsia" },
  },
  render: () => <ProductView id="demo-product" />,
};