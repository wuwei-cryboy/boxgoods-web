import type { Meta, StoryObj } from "@storybook/react";
import SearchView from "@/components/SearchView";

const meta: Meta<typeof SearchView> = {
  title: "Components/SearchView",
  component: SearchView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SearchView>;

export const Default: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light" },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px", minHeight: "800px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Chinese: Story = {
  parameters: {
    globals: { locale: "zh", theme: "light" },
  },
};

export const DarkMode: Story = {
  parameters: {
    globals: { locale: "fr", theme: "dark" },
  },
};

export const WithResults: Story = {
  parameters: {
    globals: { locale: "fr", theme: "light" },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px" }}>
        <Story />
      </div>
    ),
  },
  // 通过 URL 参数模拟搜索结果
  // 实际运行时会请求 /api/search?q=iphone
};