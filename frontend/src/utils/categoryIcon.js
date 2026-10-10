import {
  Briefcase,
  Film,
  Heart,
  House,
  Laptop,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
} from "lucide-react";

const categoryIcons = {
  utensils: Utensils,
  plane: Plane,
  home: House,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  heart: Heart,
  film: Film,
  tag: Tag,
  briefcase: Briefcase,
  laptop: Laptop,
};

export default function categoryIcon(icon) {
  return categoryIcons[icon?.toLowerCase()] || Tag;
}
