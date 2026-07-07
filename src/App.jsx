import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Leaf, Moon, Droplet, Flame, Activity, Heart, Utensils, Calendar,
  Download, Share2, RefreshCw, ChevronRight, ChevronLeft, Check, X, Menu,
  Sparkles, Salad, Scale, ShieldCheck, Egg, Fish, Wheat, ArrowRight, Info,
  Quote, Star, ArrowUpRight, Coffee, Sunrise, Sunset, Cookie, Palette,
  Loader2, ChevronDown,
} from "lucide-react";
import { jsPDF } from "jspdf";

/* ============================== FONT INJECTION ============================== */
function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,400..600&family=Big+Shoulders+Display:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
}

/* ============================== PREMIUM THEMES ============================== */
const THEMES = [
  { key: "sage", label: "Sage Garden", swatch: ["#35633F", "#FF6A2B", "#A13850"] },
  { key: "ocean", label: "Ocean Mist", swatch: ["#0E6E70", "#F2A93B", "#1B4B6B"] },
  { key: "sunset", label: "Sunset Bloom", swatch: ["#C6491F", "#E8A33D", "#8E3B5D"] },
  { key: "orchid", label: "Orchid Luxe", swatch: ["#6B3F76", "#D9A441", "#B75C7A"] },
];
const THEME_STORAGE_KEY = "nutriplan-theme";

function ThemeSwitcher({ theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const current = THEMES.find((t) => t.key === theme) || THEMES[0];
  return (
    <div className="theme-switcher" ref={ref}>
      <button className="icon-btn theme-trigger" onClick={() => setOpen((o) => !o)} aria-label="Choose theme" title="Choose a theme">
        <Palette size={18} />
        <i className="theme-trigger-dot" style={{ background: current.swatch[0] }} />
      </button>
      {open && (
        <div className="theme-popover">
          <span className="theme-popover-title">Pick a premium theme</span>
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`theme-option ${theme === t.key ? "active" : ""}`}
              onClick={() => { setTheme(t.key); setOpen(false); }}
            >
              <span className="theme-swatch">
                {t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}
              </span>
              {t.label}
              {theme === t.key && <Check size={14} className="theme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== REVEAL-ON-SCROLL HOOK ============================== */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setInView(true); obs.unobserve(e.target); } }),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}
function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, inView] = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${inView ? "in-view" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ============================== DATA: MEALS ============================== */
const SLOT_ORDER = ["breakfast", "midMorning", "lunch", "eveningSnack", "dinner", "beforeBed"];
const SLOT_LABEL = {
  breakfast: "Breakfast", midMorning: "Mid-Morning Snack", lunch: "Lunch",
  eveningSnack: "Evening Snack", dinner: "Dinner", beforeBed: "Before Bed",
};
const SLOT_TIME = {
  breakfast: "7:30 AM", midMorning: "10:30 AM", lunch: "1:30 PM",
  eveningSnack: "5:00 PM", dinner: "8:00 PM", beforeBed: "9:45 PM",
};
const SLOT_ICON = {
  breakfast: Sunrise, midMorning: Coffee, lunch: Utensils,
  eveningSnack: Cookie, dinner: Sunset, beforeBed: Moon,
};
const SLOT_COLOR = {
  breakfast: "var(--citrus)", midMorning: "var(--leaf)", lunch: "var(--berry)",
  eveningSnack: "var(--citrus)", dinner: "var(--leaf)", beforeBed: "var(--berry)",
};
function slotsForMealCount(n) {
  if (n === 3) return ["breakfast", "lunch", "dinner"];
  if (n === 4) return ["breakfast", "lunch", "eveningSnack", "dinner"];
  if (n === 5) return ["breakfast", "midMorning", "lunch", "eveningSnack", "dinner"];
  return SLOT_ORDER;
}

const MEAL_DB = {
  vegetarian: {
    breakfast: [
      { name: "Vegetable Poha", qty: "1.5 cups (200g)", cal: 270, p: 6, c: 48, f: 6, fiber: 5, alt: "Vegetable Upma", reason: "Light, high in carbs to fuel the morning; peanuts add protein and healthy fat." },
      { name: "Moong Dal Chilla (2 pcs)", qty: "2 pieces + mint chutney", cal: 260, p: 14, c: 28, f: 8, fiber: 6, alt: "Besan Chilla", reason: "Lentil-based batter gives a protein head-start rarely found in typical breakfasts." },
      { name: "Vegetable Upma with Peanuts", qty: "1.5 cups (220g)", cal: 290, p: 8, c: 46, f: 9, fiber: 5, alt: "Vegetable Poha", reason: "Semolina provides sustained energy; vegetables add fibre and micronutrients." },
      { name: "Paneer Bhurji with Multigrain Toast", qty: "100g paneer + 2 slices", cal: 340, p: 20, c: 30, f: 15, fiber: 4, alt: "Sprouts Bhurji", reason: "Paneer delivers a strong protein base to reduce mid-morning hunger." },
    ],
    midMorning: [
      { name: "Mixed Fruit Bowl", qty: "1 cup (150g)", cal: 90, p: 1, c: 22, f: 0, fiber: 4, alt: "Buttermilk (1 glass)", reason: "Natural sugars and fibre curb cravings without a calorie spike." },
      { name: "Roasted Chana", qty: "30g", cal: 130, p: 7, c: 18, f: 3, fiber: 6, alt: "Handful of almonds (10)", reason: "Crunchy, protein-rich snack that keeps blood sugar stable." },
      { name: "Buttermilk (Spiced)", qty: "1 glass (250ml)", cal: 60, p: 3, c: 6, f: 2, fiber: 0, alt: "Coconut Water", reason: "Probiotic and hydrating; supports digestion between meals." },
      { name: "Sprouts Chaat", qty: "1 cup (100g)", cal: 110, p: 7, c: 16, f: 2, fiber: 5, alt: "Mixed Fruit Bowl", reason: "Sprouting increases protein bioavailability and fibre content." },
    ],
    lunch: [
      { name: "Dal, 2 Roti, Sabzi, Salad", qty: "1 cup dal + 2 roti + 1 cup sabzi", cal: 520, p: 20, c: 78, f: 12, fiber: 12, alt: "Rajma Chawal", reason: "Balanced thali covering complex carbs, plant protein, and fibre in one plate." },
      { name: "Rajma Chawal with Salad", qty: "1 cup rajma + 1 cup rice", cal: 540, p: 18, c: 88, f: 8, fiber: 14, alt: "Chole with Roti", reason: "Kidney beans are rich in fibre and protein, ideal for satiety." },
      { name: "Paneer Curry, 2 Roti, Salad", qty: "120g paneer + 2 roti", cal: 560, p: 26, c: 60, f: 20, fiber: 8, alt: "Soya Chunk Curry with Rice", reason: "Higher protein lunch option that supports muscle maintenance." },
      { name: "Vegetable Khichdi with Curd", qty: "2 cups + 1 cup curd", cal: 500, p: 16, c: 76, f: 10, fiber: 9, alt: "Dal Roti Sabzi", reason: "Easy to digest, balanced one-pot meal with probiotic curd on the side." },
    ],
    eveningSnack: [
      { name: "Roasted Makhana", qty: "1 cup (30g)", cal: 110, p: 3, c: 18, f: 3, fiber: 3, alt: "Vegetable Soup", reason: "Low-calorie crunchy snack that satisfies without derailing calories." },
      { name: "Vegetable Soup", qty: "1 bowl (250ml)", cal: 90, p: 3, c: 12, f: 3, fiber: 3, alt: "Roasted Makhana", reason: "Warm, filling, and hydrating with minimal calories." },
      { name: "Green Tea + 4 Almonds", qty: "1 cup + 4 almonds", cal: 80, p: 2, c: 4, f: 6, fiber: 1, alt: "Roasted Chana", reason: "Antioxidants from tea paired with healthy fats from almonds." },
      { name: "Sprouts Salad", qty: "1 cup (100g)", cal: 110, p: 7, c: 16, f: 2, fiber: 5, alt: "Roasted Makhana", reason: "Keeps protein trickling in before dinner to reduce overeating." },
    ],
    dinner: [
      { name: "Dal, 1 Roti, Sabzi", qty: "1 cup dal + 1 roti + 1 cup sabzi", cal: 420, p: 18, c: 55, f: 10, fiber: 11, alt: "Vegetable Khichdi", reason: "Lighter than lunch to support digestion before sleep." },
      { name: "Paneer Tikka with Salad", qty: "150g paneer + salad", cal: 400, p: 26, c: 20, f: 22, fiber: 6, alt: "Grilled Soya Tikka", reason: "Low-carb, high-protein dinner supports overnight recovery." },
      { name: "Vegetable Soup with Multigrain Toast", qty: "1 bowl + 2 slices", cal: 320, p: 10, c: 46, f: 8, fiber: 6, alt: "Dal Roti Sabzi", reason: "Light and easily digestible option for a calmer night's sleep." },
      { name: "Stir-Fried Tofu & Vegetables", qty: "150g tofu + 1 cup veg", cal: 380, p: 22, c: 24, f: 20, fiber: 8, alt: "Paneer Tikka with Salad", reason: "Plant protein with minimal oil keeps the evening meal light yet filling." },
    ],
    beforeBed: [
      { name: "Warm Turmeric Milk", qty: "1 glass (200ml)", cal: 120, p: 6, c: 12, f: 5, fiber: 0, alt: "Chamomile Tea", reason: "Traditionally supports relaxation and recovery overnight." },
      { name: "A Handful of Walnuts (5)", qty: "5 halves (15g)", cal: 100, p: 2, c: 2, f: 10, fiber: 1, alt: "Warm Turmeric Milk", reason: "Omega-3 fats in small quantity without disturbing sleep digestion." },
      { name: "Chamomile Tea", qty: "1 cup", cal: 5, p: 0, c: 1, f: 0, fiber: 0, alt: "Warm Turmeric Milk", reason: "Caffeine-free, calming beverage to wind down the day." },
      { name: "Roasted Fox Nuts (Light)", qty: "15g", cal: 60, p: 2, c: 9, f: 2, fiber: 2, alt: "A Handful of Walnuts", reason: "Light bite that won't spike blood sugar before bedtime." },
    ],
  },
  nonVegetarian: {
    breakfast: [
      { name: "Egg Bhurji with Multigrain Toast", qty: "2 eggs + 2 slices", cal: 320, p: 20, c: 26, f: 15, fiber: 4, alt: "Chicken Sausage & Toast", reason: "High-quality complete protein to start the day strong." },
      { name: "Boiled Eggs with Oats Upma", qty: "2 eggs + 1 cup oats", cal: 360, p: 22, c: 38, f: 12, fiber: 6, alt: "Egg Bhurji with Toast", reason: "Combines fast protein with slow-release carbs from oats." },
      { name: "Chicken Sausage & Vegetable Sauté", qty: "2 sausages + veg", cal: 340, p: 22, c: 18, f: 18, fiber: 3, alt: "Egg Omelette with Toast", reason: "Lean protein forward breakfast to support satiety till lunch." },
      { name: "Vegetable Poha with Boiled Egg", qty: "1.5 cups + 1 egg", cal: 330, p: 14, c: 46, f: 9, fiber: 5, alt: "Egg Bhurji with Toast", reason: "Balances familiar comfort food with an added protein boost." },
    ],
    midMorning: [
      { name: "Buttermilk (Spiced)", qty: "1 glass (250ml)", cal: 60, p: 3, c: 6, f: 2, fiber: 0, alt: "Mixed Fruit Bowl", reason: "Light, probiotic-rich, and hydrating between meals." },
      { name: "Roasted Chana", qty: "30g", cal: 130, p: 7, c: 18, f: 3, fiber: 6, alt: "Boiled Egg (1)", reason: "Fibre-protein combo keeps hunger away without heaviness." },
      { name: "Boiled Egg (1)", qty: "1 egg", cal: 78, p: 6, c: 1, f: 5, fiber: 0, alt: "Roasted Chana", reason: "Quick portable protein snack for busy mornings." },
      { name: "Mixed Fruit Bowl", qty: "1 cup (150g)", cal: 90, p: 1, c: 22, f: 0, fiber: 4, alt: "Buttermilk", reason: "Natural vitamins and fibre for a refreshing mid-morning lift." },
    ],
    lunch: [
      { name: "Grilled Chicken, 2 Roti, Salad", qty: "150g chicken + 2 roti", cal: 560, p: 40, c: 55, f: 15, fiber: 8, alt: "Fish Curry with Rice", reason: "Lean protein paired with complex carbs for sustained energy." },
      { name: "Fish Curry with Rice", qty: "150g fish + 1 cup rice", cal: 540, p: 32, c: 60, f: 16, fiber: 5, alt: "Chicken Curry with Roti", reason: "Omega-3 rich fish supports heart health alongside balanced carbs." },
      { name: "Chicken Curry, 1 Roti, Dal", qty: "150g chicken + 1 roti + dal", cal: 570, p: 38, c: 52, f: 18, fiber: 9, alt: "Grilled Chicken with Rice", reason: "Combines animal and plant protein for a fuller amino acid profile." },
      { name: "Egg Curry with Rice & Salad", qty: "2 eggs + 1 cup rice", cal: 520, p: 24, c: 62, f: 16, fiber: 6, alt: "Grilled Chicken, Roti, Salad", reason: "Budget-friendly protein option that's quick to prepare." },
    ],
    eveningSnack: [
      { name: "Roasted Makhana", qty: "1 cup (30g)", cal: 110, p: 3, c: 18, f: 3, fiber: 3, alt: "Grilled Chicken Strips (50g)", reason: "Light crunchy snack that won't crowd out dinner appetite." },
      { name: "Grilled Chicken Strips", qty: "50g", cal: 110, p: 18, c: 0, f: 4, fiber: 0, alt: "Boiled Egg (1)", reason: "Extra lean protein to keep muscles fed through the evening." },
      { name: "Vegetable Soup", qty: "1 bowl (250ml)", cal: 90, p: 3, c: 12, f: 3, fiber: 3, alt: "Roasted Makhana", reason: "Warm and light, ideal before an evening workout or walk." },
      { name: "Green Tea + Boiled Egg", qty: "1 cup + 1 egg", cal: 130, p: 6, c: 1, f: 5, fiber: 0, alt: "Grilled Chicken Strips", reason: "Antioxidants plus a protein top-up before dinner." },
    ],
    dinner: [
      { name: "Grilled Fish with Steamed Vegetables", qty: "150g fish + 1 cup veg", cal: 380, p: 34, c: 18, f: 18, fiber: 6, alt: "Chicken Stir-Fry with Vegetables", reason: "Light, high-protein dinner that's easy on digestion overnight." },
      { name: "Chicken Stir-Fry with Vegetables", qty: "150g chicken + 1 cup veg", cal: 400, p: 36, c: 20, f: 16, fiber: 6, alt: "Grilled Fish with Vegetables", reason: "Minimal oil preparation keeps calories controlled at night." },
      { name: "Egg White Omelette with Salad", qty: "3 egg whites + salad", cal: 260, p: 22, c: 10, f: 10, fiber: 4, alt: "Grilled Fish with Vegetables", reason: "Very light option ideal on days with lower activity." },
      { name: "Dal, 1 Roti, Grilled Chicken", qty: "0.5 cup dal + 1 roti + 100g chicken", cal: 420, p: 32, c: 38, f: 14, fiber: 7, alt: "Chicken Stir-Fry", reason: "Combines plant and animal protein for a well-rounded dinner." },
    ],
    beforeBed: [
      { name: "Warm Turmeric Milk", qty: "1 glass (200ml)", cal: 120, p: 6, c: 12, f: 5, fiber: 0, alt: "Chamomile Tea", reason: "Supports relaxation and gentle overnight recovery." },
      { name: "A Handful of Walnuts (5)", qty: "5 halves (15g)", cal: 100, p: 2, c: 2, f: 10, fiber: 1, alt: "Warm Turmeric Milk", reason: "Small dose of omega-3 fats before sleep." },
      { name: "Chamomile Tea", qty: "1 cup", cal: 5, p: 0, c: 1, f: 0, fiber: 0, alt: "Warm Turmeric Milk", reason: "Caffeine-free way to wind the day down." },
      { name: "Boiled Egg White (1)", qty: "1 egg white", cal: 17, p: 4, c: 0, f: 0, fiber: 0, alt: "A Handful of Walnuts", reason: "Minimal-calorie protein top-up for overnight muscle repair." },
    ],
  },
  vegan: {
    breakfast: [
      { name: "Vegetable Poha (No Ghee)", qty: "1.5 cups (200g)", cal: 250, p: 5, c: 48, f: 4, fiber: 5, alt: "Vegetable Upma (Oil-free)", reason: "Plant-based, light carb-forward start using peanuts for protein." },
      { name: "Chickpea Flour Chilla (2 pcs)", qty: "2 pieces + chutney", cal: 250, p: 12, c: 28, f: 7, fiber: 6, alt: "Moong Dal Chilla", reason: "Besan is naturally vegan and rich in plant protein and fibre." },
      { name: "Overnight Oats with Almond Milk & Fruit", qty: "1 cup", cal: 300, p: 8, c: 50, f: 8, fiber: 7, alt: "Chickpea Flour Chilla", reason: "No prep needed the morning of; fibre-rich and naturally sweetened." },
      { name: "Tofu Bhurji with Multigrain Toast", qty: "100g tofu + 2 slices", cal: 320, p: 18, c: 30, f: 14, fiber: 5, alt: "Chickpea Flour Chilla", reason: "Tofu mimics egg bhurji texture while keeping the meal fully plant-based." },
    ],
    midMorning: [
      { name: "Mixed Fruit Bowl", qty: "1 cup (150g)", cal: 90, p: 1, c: 22, f: 0, fiber: 4, alt: "Coconut Water", reason: "Natural sugars and fibre for a clean energy lift." },
      { name: "Roasted Chana", qty: "30g", cal: 130, p: 7, c: 18, f: 3, fiber: 6, alt: "Almonds (10)", reason: "Plant protein and fibre combination curbs mid-morning hunger." },
      { name: "Coconut Water", qty: "1 glass (250ml)", cal: 60, p: 1, c: 14, f: 0, fiber: 1, alt: "Mixed Fruit Bowl", reason: "Natural electrolytes for hydration between meals." },
      { name: "Sprouts Chaat", qty: "1 cup (100g)", cal: 110, p: 7, c: 16, f: 2, fiber: 5, alt: "Roasted Chana", reason: "Sprouting boosts protein and micronutrient availability." },
    ],
    lunch: [
      { name: "Rajma Chawal with Salad", qty: "1 cup rajma + 1 cup rice", cal: 520, p: 18, c: 86, f: 6, fiber: 14, alt: "Chole with Brown Rice", reason: "Kidney beans supply plant protein and fibre for lasting satiety." },
      { name: "Chole with Brown Rice", qty: "1 cup chole + 1 cup rice", cal: 540, p: 17, c: 90, f: 8, fiber: 13, alt: "Rajma Chawal", reason: "Chickpeas add protein and fibre; brown rice slows digestion." },
      { name: "Tofu & Vegetable Curry with Roti", qty: "150g tofu + 2 roti", cal: 500, p: 24, c: 55, f: 16, fiber: 9, alt: "Soya Chunk Curry with Rice", reason: "Tofu provides a complete plant protein for the main meal." },
      { name: "Mixed Dal & Vegetable Khichdi", qty: "2 cups", cal: 480, p: 16, c: 78, f: 8, fiber: 10, alt: "Rajma Chawal", reason: "One-pot balanced meal, gentle on digestion, fully plant-based." },
    ],
    eveningSnack: [
      { name: "Roasted Makhana", qty: "1 cup (30g)", cal: 110, p: 3, c: 18, f: 3, fiber: 3, alt: "Vegetable Soup", reason: "Light, crunchy, naturally vegan snack." },
      { name: "Hummus with Carrot Sticks", qty: "3 tbsp + veg sticks", cal: 150, p: 5, c: 14, f: 9, fiber: 4, alt: "Roasted Makhana", reason: "Chickpea-based dip adds protein and healthy fat to the snack." },
      { name: "Vegetable Soup", qty: "1 bowl (250ml)", cal: 90, p: 3, c: 12, f: 3, fiber: 3, alt: "Hummus with Carrot Sticks", reason: "Warm and light option to bridge lunch and dinner." },
      { name: "Trail Mix (Nuts & Raisins)", qty: "20g", cal: 110, p: 3, c: 10, f: 7, fiber: 2, alt: "Roasted Makhana", reason: "Compact energy with healthy fats for an active evening." },
    ],
    dinner: [
      { name: "Stir-Fried Tofu & Vegetables", qty: "150g tofu + 1 cup veg", cal: 360, p: 20, c: 22, f: 18, fiber: 8, alt: "Soya Chunk Curry with Vegetables", reason: "Light, high plant-protein dinner supports overnight recovery." },
      { name: "Soya Chunk Curry with Vegetables", qty: "1 cup soya + veg", cal: 380, p: 24, c: 30, f: 14, fiber: 9, alt: "Stir-Fried Tofu & Vegetables", reason: "Soya chunks are protein-dense, ideal for a plant-based dinner." },
      { name: "Vegetable & Lentil Soup with Toast", qty: "1 bowl + 2 slices", cal: 320, p: 12, c: 46, f: 7, fiber: 8, alt: "Stir-Fried Tofu & Vegetables", reason: "Warm, fibre-rich, and easy to digest before bed." },
      { name: "Chickpea & Spinach Curry with Roti", qty: "1 cup + 1 roti", cal: 400, p: 16, c: 50, f: 12, fiber: 10, alt: "Soya Chunk Curry", reason: "Iron-rich spinach paired with fibre-dense chickpeas." },
    ],
    beforeBed: [
      { name: "Warm Almond Milk with Turmeric", qty: "1 glass (200ml)", cal: 90, p: 2, c: 8, f: 5, fiber: 1, alt: "Chamomile Tea", reason: "Dairy-free way to enjoy a calming, warm bedtime drink." },
      { name: "A Handful of Walnuts (5)", qty: "5 halves (15g)", cal: 100, p: 2, c: 2, f: 10, fiber: 1, alt: "Warm Almond Milk", reason: "Small plant-based omega-3 boost before sleep." },
      { name: "Chamomile Tea", qty: "1 cup", cal: 5, p: 0, c: 1, f: 0, fiber: 0, alt: "Warm Almond Milk", reason: "Naturally caffeine-free and calming." },
      { name: "Roasted Fox Nuts (Light)", qty: "15g", cal: 60, p: 2, c: 9, f: 2, fiber: 2, alt: "A Handful of Walnuts", reason: "Light, low-sugar bite that won't disturb sleep." },
    ],
  },
  eggetarian: {
    breakfast: [
      { name: "Egg Bhurji with Multigrain Toast", qty: "2 eggs + 2 slices", cal: 320, p: 20, c: 26, f: 15, fiber: 4, alt: "Vegetable Poha with Boiled Egg", reason: "Complete protein from eggs plus fibre from whole grain toast." },
      { name: "Vegetable Poha with Boiled Egg", qty: "1.5 cups + 1 egg", cal: 330, p: 14, c: 46, f: 9, fiber: 5, alt: "Egg Bhurji with Toast", reason: "Familiar comfort food upgraded with an added protein source." },
      { name: "Masala Omelette with Toast", qty: "2 eggs + 2 slices", cal: 340, p: 20, c: 28, f: 16, fiber: 4, alt: "Boiled Eggs with Oats Upma", reason: "Spiced, satisfying, and quick to prepare on busy mornings." },
      { name: "Boiled Eggs with Oats Upma", qty: "2 eggs + 1 cup oats", cal: 360, p: 22, c: 38, f: 12, fiber: 6, alt: "Egg Bhurji with Toast", reason: "Combines fast protein with slow-release oat carbohydrates." },
    ],
    midMorning: [
      { name: "Buttermilk (Spiced)", qty: "1 glass (250ml)", cal: 60, p: 3, c: 6, f: 2, fiber: 0, alt: "Mixed Fruit Bowl", reason: "Light and probiotic-rich between-meal refresher." },
      { name: "Boiled Egg (1)", qty: "1 egg", cal: 78, p: 6, c: 1, f: 5, fiber: 0, alt: "Roasted Chana", reason: "Portable protein snack for a steady energy level." },
      { name: "Roasted Chana", qty: "30g", cal: 130, p: 7, c: 18, f: 3, fiber: 6, alt: "Boiled Egg (1)", reason: "Fibre and plant protein combination to manage hunger." },
      { name: "Mixed Fruit Bowl", qty: "1 cup (150g)", cal: 90, p: 1, c: 22, f: 0, fiber: 4, alt: "Buttermilk", reason: "Vitamin-rich, naturally sweet mid-morning pick-me-up." },
    ],
    lunch: [
      { name: "Egg Curry with Rice & Salad", qty: "2 eggs + 1 cup rice", cal: 520, p: 24, c: 62, f: 16, fiber: 6, alt: "Rajma Chawal", reason: "Protein-rich curry paired with balanced carbohydrates." },
      { name: "Dal, 2 Roti, Sabzi, Boiled Egg", qty: "1 cup dal + 2 roti + 1 egg", cal: 560, p: 24, c: 78, f: 14, fiber: 12, alt: "Egg Curry with Rice", reason: "Classic thali with an added egg for extra protein." },
      { name: "Rajma Chawal with Boiled Egg", qty: "1 cup rajma + rice + 1 egg", cal: 560, p: 22, c: 86, f: 10, fiber: 14, alt: "Dal Roti Sabzi with Egg", reason: "Combines plant and egg protein with high fibre content." },
      { name: "Egg Fried Rice with Vegetables", qty: "1.5 cups + 2 eggs", cal: 540, p: 22, c: 70, f: 16, fiber: 6, alt: "Egg Curry with Rice", reason: "A flavourful way to include vegetables and protein together." },
    ],
    eveningSnack: [
      { name: "Roasted Makhana", qty: "1 cup (30g)", cal: 110, p: 3, c: 18, f: 3, fiber: 3, alt: "Boiled Egg (1)", reason: "Light, crunchy snack that fits neatly before dinner." },
      { name: "Boiled Egg (1)", qty: "1 egg", cal: 78, p: 6, c: 1, f: 5, fiber: 0, alt: "Roasted Makhana", reason: "Small protein top-up to curb evening hunger." },
      { name: "Vegetable Soup", qty: "1 bowl (250ml)", cal: 90, p: 3, c: 12, f: 3, fiber: 3, alt: "Roasted Makhana", reason: "Warm and light, ideal before an evening walk." },
      { name: "Green Tea + Roasted Chana", qty: "1 cup + 20g", cal: 100, p: 5, c: 12, f: 2, fiber: 4, alt: "Boiled Egg (1)", reason: "Antioxidants paired with a light plant-protein bite." },
    ],
    dinner: [
      { name: "Egg White Omelette with Salad", qty: "3 egg whites + salad", cal: 260, p: 22, c: 10, f: 10, fiber: 4, alt: "Dal, 1 Roti, Sabzi", reason: "Very light, high-protein option ideal for the evening." },
      { name: "Dal, 1 Roti, Sabzi", qty: "1 cup dal + 1 roti + 1 cup sabzi", cal: 420, p: 18, c: 55, f: 10, fiber: 11, alt: "Egg White Omelette with Salad", reason: "Balanced, lighter-than-lunch meal to ease digestion overnight." },
      { name: "Egg Curry (Light) with Roti", qty: "2 eggs + 1 roti", cal: 400, p: 22, c: 34, f: 16, fiber: 6, alt: "Egg White Omelette", reason: "Moderate portion keeps protein high without overloading calories." },
      { name: "Vegetable Soup with Boiled Egg", qty: "1 bowl + 1 egg", cal: 260, p: 12, c: 22, f: 10, fiber: 5, alt: "Dal Roti Sabzi", reason: "Warm and light, with a protein boost from the egg." },
    ],
    beforeBed: [
      { name: "Warm Turmeric Milk", qty: "1 glass (200ml)", cal: 120, p: 6, c: 12, f: 5, fiber: 0, alt: "Chamomile Tea", reason: "Supports relaxation and gentle overnight recovery." },
      { name: "A Handful of Walnuts (5)", qty: "5 halves (15g)", cal: 100, p: 2, c: 2, f: 10, fiber: 1, alt: "Warm Turmeric Milk", reason: "Small omega-3 boost before sleep." },
      { name: "Chamomile Tea", qty: "1 cup", cal: 5, p: 0, c: 1, f: 0, fiber: 0, alt: "Warm Turmeric Milk", reason: "Caffeine-free way to wind down." },
      { name: "Boiled Egg White (1)", qty: "1 egg white", cal: 17, p: 4, c: 0, f: 0, fiber: 0, alt: "A Handful of Walnuts", reason: "Minimal-calorie protein top-up for overnight repair." },
    ],
  },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ACTIVITY_MULT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
const ACTIVITY_LABEL = {
  sedentary: "Sedentary", light: "Lightly Active", moderate: "Moderately Active",
  active: "Active", veryActive: "Very Active",
};

const CONDITION_TIPS = {
  Diabetes: "Favour low glycemic-index foods, avoid sugary drinks, and space carbohydrates evenly through the day.",
  Thyroid: "Include iodine and selenium-rich foods; keep meal timing consistent to support metabolism.",
  "High Blood Pressure": "Limit added salt and processed foods; prioritise potassium-rich vegetables and fruits.",
  Cholesterol: "Choose healthy unsaturated fats, increase soluble fibre, and limit deep-fried foods.",
  PCOS: "Prioritise fibre and protein at each meal to support insulin sensitivity; limit refined sugar.",
  "Heart Disease": "Reduce saturated fat and sodium; emphasise omega-3 sources and whole grains.",
};

const SMART_TIPS_BASE = [
  { icon: Droplet, text: "Drink water steadily through the day rather than all at once." },
  { icon: Activity, text: "Aim for at least 45 minutes of brisk walking or light activity daily." },
  { icon: Moon, text: "Target 7–8 hours of quality sleep to support recovery and appetite control." },
  { icon: Salad, text: "Fill half your plate with vegetables at lunch and dinner." },
  { icon: X, text: "Limit sugary drinks and packaged fruit juices." },
  { icon: X, text: "Cut back on deep-fried and heavily processed snacks." },
];

const MARQUEE_WORDS = [
  "PROTEIN", "•", "COMPLEX CARBS", "•", "HEALTHY FATS", "•", "FIBRE", "•",
  "VITAMINS", "•", "HYDRATION", "•", "NO SIGN-UP", "•", "SEVEN DAYS", "•", "ZERO REPEATS", "•",
];

/* ============================== CALCULATIONS ============================== */
function calculateAll(form) {
  const age = Number(form.age), weight = Number(form.weight);
  const totalInches = Number(form.heightFt) * 12 + Number(form.heightIn || 0);
  const height = totalInches * 2.54; // cm, used internally for BMI/BMR
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  let bmiCategory = "Normal";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  const bmr = form.gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULT[form.activity];

  let dailyCalories = tdee;
  let calorieDeficit = 0, calorieSurplus = 0;
  if (form.goal === "lose") {
    dailyCalories = Math.max(tdee - 500, form.gender === "male" ? 1500 : 1200);
    calorieDeficit = Math.round(tdee - dailyCalories);
  } else if (form.goal === "gain") {
    dailyCalories = tdee + 400;
    calorieSurplus = Math.round(dailyCalories - tdee);
  }

  const proteinPerKg = form.goal === "lose" ? 2.0 : form.goal === "gain" ? 1.8 : 1.6;
  const proteinG = proteinPerKg * weight;
  const proteinCal = proteinG * 4;

  const fatCal = dailyCalories * 0.27;
  const fatG = fatCal / 9;

  const carbCal = Math.max(dailyCalories - proteinCal - fatCal, 0);
  const carbG = carbCal / 4;

  const fiberG = (dailyCalories / 1000) * 14;
  const waterL = Math.round(weight * 0.035 * 10) / 10;

  return {
    bmi: Math.round(bmi * 10) / 10, bmiCategory, bmr: Math.round(bmr), tdee: Math.round(tdee),
    dailyCalories: Math.round(dailyCalories), calorieDeficit, calorieSurplus,
    proteinG: Math.round(proteinG), carbG: Math.round(carbG), fatG: Math.round(fatG),
    fiberG: Math.round(fiberG), waterL, heightCm: Math.round(height * 10) / 10,
  };
}

function formatHeight(form) {
  return `${form.heightFt}'${form.heightIn || 0}"`;
}

function generateDayMeals(form, dayIndex) {
  const dietDb = MEAL_DB[form.dietPref];
  const slots = slotsForMealCount(Number(form.mealsPerDay));
  return slots.map((slot) => {
    const variants = dietDb[slot];
    const item = variants[dayIndex % variants.length];
    return { slot, label: SLOT_LABEL[slot], time: SLOT_TIME[slot], ...item };
  });
}
function generateWeekPlan(form) {
  return DAYS.map((day, i) => ({ day, meals: generateDayMeals(form, i) }));
}

/* ============================== SIGNATURE COMPONENTS ============================== */
function RingChart({ protein, carb, fat, size = 220 }) {
  const total = protein + carb + fat || 1;
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 150); return () => clearTimeout(t); }, []);
  const segs = [
    { pct: protein / total, color: "var(--leaf)" },
    { pct: carb / total, color: "var(--citrus)" },
    { pct: fat / total, color: "var(--berry)" },
  ];
  let offsetAcc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
      {segs.map((s, i) => {
        const dash = ready ? s.pct * c : 0;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offsetAcc} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)", transitionDelay: `${i * 120}ms` }} />
        );
        offsetAcc += s.pct * c;
        return el;
      })}
      <text x="50%" y="46%" textAnchor="middle" fontFamily="'Big Shoulders Display'" fontSize="34" fontWeight="800" fill="var(--text)">{total}g</text>
      <text x="50%" y="61%" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="var(--muted)">total macros</text>
    </svg>
  );
}

function FactsPanel({ calories = 2150, protein = 35, carb = 45, fat = 20 }) {
  const [live, setLive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLive(true), 400); return () => clearTimeout(t); }, []);
  const rows = [
    { label: "Protein", value: protein, color: "var(--leaf)" },
    { label: "Carbohydrates", value: carb, color: "var(--citrus)" },
    { label: "Healthy Fat", value: fat, color: "var(--berry)" },
  ];
  return (
    <div className="facts-panel">
      <div className="facts-eyebrow">Daily Values <span>— Your Plate</span></div>
      <div className="facts-rule thick" />
      <div className="facts-cal-row">
        <span className="facts-cal-label">Calories</span>
        <span className="facts-cal-value">{calories.toLocaleString()}</span>
      </div>
      <div className="facts-rule thin" />
      {rows.map((row) => (
        <div className="facts-row" key={row.label}>
          <span>{row.label}</span>
          <div className="facts-bar-track">
            <div className="facts-bar-fill" style={{ width: live ? `${row.value}%` : "0%", background: row.color }} />
          </div>
          <span className="facts-pct">{row.value}%</span>
        </div>
      ))}
      <div className="facts-rule thick" />
      <p className="facts-footnote">*Illustrative split — your exact numbers are calculated after the form.</p>
    </div>
  );
}

function HeroMesh() {
  return (
    <div className="hero-mesh" aria-hidden="true">
      <span /><span /><span /><span />
    </div>
  );
}

function SealBadge() {
  return (
    <div className="seal-badge">
      <svg viewBox="0 0 100 100" className="seal-ring">
        <defs>
          <path id="sealCircle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
        <text fontSize="6.6" fontWeight="700" letterSpacing="2" fill="var(--text)">
          <textPath href="#sealCircle" startOffset="0%">
            FRESH PLAN DAILY • NO SIGN-UP • 100% FREE •&#160;
          </textPath>
        </text>
      </svg>
      <div className="seal-center"><Leaf size={20} /></div>
    </div>
  );
}

function Marquee() {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
          <span className={`marquee-item ${w === "•" ? "dot" : ""}`} key={i}>{w}</span>
        ))}
      </div>
    </div>
  );
}

function AnimatedNumber({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame; const start = performance.now(); const duration = 900; const to = value;
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(to * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

function StatCard({ icon: Icon, label, value, unit, accent, i = 0 }) {
  return (
    <div className="stat-card" style={{ transitionDelay: `${i * 60}ms` }}>
      <div className="stat-icon" style={{ background: accent }}><Icon size={19} color="#fff" /></div>
      <div>
        <div className="stat-value">
          <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
          <span className="stat-unit">{unit}</span>
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast"><Check size={16} /> {message}</div>;
}

/* ============================== LANDING PAGE ============================== */
function Landing({ onStart, theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    const t = setTimeout(() => setLoaded(true), 60);
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, []);

  const features = [
    { icon: Sparkles, title: "Science-Backed Numbers", body: "BMI, BMR and TDEE calculated with the Mifflin-St Jeor equation — the same standard dietitians use." },
    { icon: Utensils, title: "A Full Week, Never Repeated", body: "Six meal slots a day, seven distinct days — built from a real Indian-forward food library." },
    { icon: Activity, title: "Built Around Your Body", body: "Every gram of protein, carb and fat is tuned to your goal, activity level, and lifestyle." },
    { icon: ShieldCheck, title: "Nothing To Sign Up For", body: "No accounts, no passwords, no data stored anywhere. Close the tab and it's gone." },
  ];
  const faqs = [
    { q: "Do I need to create an account?", a: "No. NutriPlan AI works instantly for every visitor — no login, no email, no OTP." },
    { q: "Is my data stored anywhere?", a: "No. Everything is calculated in your browser for this session only and is never saved to a server." },
    { q: "What formula is used for calories?", a: "We use the Mifflin-St Jeor equation for BMR, then apply standard activity multipliers to estimate your TDEE." },
    { q: "Can I use this if I have a medical condition?", a: "We include general guidance for common conditions, but always consult a doctor or registered dietitian for medical advice." },
    { q: "Is this app free?", a: "Completely free — no ads, no payment gateway, no subscriptions." },
  ];
  const testimonials = [
    { name: "Ananya R.", role: "Lost 6kg in 10 weeks", quote: "The weekly planner meant I never got bored — and never once ate the same dinner twice." },
    { name: "Karthik M.", role: "Muscle gain, non-vegetarian", quote: "Seeing my protein target broken down meal by meal made hitting it effortless." },
    { name: "Priya S.", role: "Vegan, maintaining weight", quote: "First planner that actually understood vegan protein sources beyond just tofu." },
  ];
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="landing-root">
      <div className="page">
        <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
          <div className="brand"><div className="brand-mark"><Leaf size={18} color="#fff" /></div><span>NutriPlan <em>AI</em></span></div>
          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <button className="btn btn-primary btn-sm" onClick={onStart}>Generate My Diet Plan</button>
          </div>
          <div className="nav-actions">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
            <button className="icon-btn mobile-only" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {menuOpen && (
            <div className="mobile-menu">
              <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
              <button className="btn btn-primary" onClick={onStart}>Generate My Diet Plan</button>
            </div>
          )}
        </nav>

        <header className="hero">
          <HeroMesh />
          <div className={`hero-copy ${loaded ? "loaded" : ""}`}>
            <div className="eyebrow"><Sparkles size={14} className="eyebrow-spark" /> Free · No sign-up · Instant results</div>
            <h1>Your plate,<br /><span className="hero-gradient-text">precisely planned.</span></h1>
            <p className="hero-sub">
              Tell us your body and your goal. In seconds, NutriPlan AI builds a full week of meals —
              timed, measured, and matched to exactly how many calories and grams of protein you need.
            </p>
            <div className="hero-cta-row">
              <button className="btn btn-primary btn-lg" onClick={onStart}>Generate My Diet Plan <ArrowRight size={18} /></button>
              <span className="hero-note">Takes under 2 minutes · No email required</span>
            </div>
            <div className="hero-badges">
              <span><Check size={14} /> No login</span>
              <span><Check size={14} /> No ads</span>
              <span><Check size={14} /> No data stored</span>
            </div>
          </div>
          <div
            className="hero-visual"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
              const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
              e.currentTarget.style.setProperty("--rx", `${ry}deg`);
              e.currentTarget.style.setProperty("--ry", `${rx}deg`);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty("--rx", `0deg`);
              e.currentTarget.style.setProperty("--ry", `0deg`);
            }}
          >
            <div className="hero-visual-inner">
              <SealBadge />
              <FactsPanel />
              <div className="floating-chip chip-cal" aria-hidden="true"><Flame size={14} /> ~2,150 kcal / day</div>
              <div className="floating-chip chip-week" aria-hidden="true"><Calendar size={14} /> 7-day planner</div>
            </div>
          </div>
          <button
            className="scroll-cue"
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Scroll to learn how it works"
          >
            <ChevronDown size={20} />
          </button>
        </header>
      </div>

      <Marquee />

      <div className="page">
        <Reveal as="section" className="section" id="how">
          <h2 className="section-title">Three steps to your week of meals</h2>
          <div className="steps-grid">
            <div className="panel-card"><span className="step-num">Body</span><h3>Tell us about you</h3><p>Age, height, weight, activity level and dietary preference — four short steps.</p></div>
            <div className="panel-card"><span className="step-num">Science</span><h3>We calculate your numbers</h3><p>BMI, BMR, TDEE, and precise macro targets using the Mifflin-St Jeor equation.</p></div>
            <div className="panel-card"><span className="step-num">Plate</span><h3>Get your full week</h3><p>Seven days, six meal slots, zero repeats — with alternatives for every dish.</p></div>
          </div>
        </Reveal>

        <Reveal as="section" className="section alt" id="features">
          <h2 className="section-title">Everything a planner should do</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="panel-card feature-card" key={i}>
                <div className="feature-icon"><f.icon size={21} /></div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <ArrowUpRight size={16} className="feature-arrow" />
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="section">
          <h2 className="section-title">What people are saying</h2>
          <div className="testimonial-grid">
            {testimonials.map((t, i) => (
              <div className="panel-card testimonial" key={i}>
                <Quote size={22} className="quote-icon" />
                <div className="stars">{[...Array(5)].map((_, s) => <Star key={s} size={13} fill="var(--citrus)" color="var(--citrus)" />)}</div>
                <p>"{t.quote}"</p>
                <div className="testimonial-name">{t.name}</div>
                <div className="testimonial-role">{t.role}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="section alt" id="faq">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <div className="faq-q">{f.q}<ChevronRight size={18} className="chev" /></div>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="section cta-section">
          <h2>Ready to see your week on a plate?</h2>
          <button className="btn btn-primary btn-lg" onClick={onStart}>Generate My Diet Plan <ArrowRight size={18} /></button>
        </Reveal>

        <footer className="footer">
          <div className="brand"><div className="brand-mark"><Leaf size={16} color="#fff" /></div><span>NutriPlan <em>AI</em></span></div>
          <p>Educational tool only — not a substitute for professional medical or dietary advice.</p>
          <p className="footer-copy">© {new Date().getFullYear()} NutriPlan AI. Built for everyone, free of charge.</p>
        </footer>
      </div>
    </div>
  );
}

/* ============================== MULTI-STEP FORM ============================== */
const initialForm = {
  age: "", gender: "male", heightFt: "", heightIn: "0", weight: "", country: "India",
  goal: "lose", targetWeight: "",
  activity: "moderate", exercise: "3-5",
  dietPref: "vegetarian", mealsPerDay: "4", allergies: "", conditions: [],
};

function FormFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState("fwd");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCondition = (c) => {
    setForm((f) => {
      if (c === "None") return { ...f, conditions: ["None"] };
      const without = f.conditions.filter((x) => x !== "None" && x !== c);
      const has = f.conditions.includes(c);
      return { ...f, conditions: has ? without : [...without, c] };
    });
  };

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      const age = Number(form.age);
      if (!form.age || age < 18 || age > 80) e.age = "Please enter an age between 18 and 80.";
      if (!form.heightFt) e.heightFt = "Please select your height.";
      const totalIn = Number(form.heightFt) * 12 + Number(form.heightIn || 0);
      if (form.heightFt && (totalIn < 40 || totalIn > 96)) e.heightFt = "Height should be between 3'4\" and 8'0\".";
      const w = Number(form.weight);
      if (!form.weight || w < 30 || w > 250) e.weight = "Weight should be between 30–250 kg.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => { if (validateStep(step)) { setDir("fwd"); setStep((s) => Math.min(s + 1, 4)); } };
  const back = () => { setDir("back"); setStep((s) => Math.max(s - 1, 1)); };
  const submit = () => { if (validateStep(1)) onComplete(form); };

  const stepTitles = ["Personal Details", "Your Goal", "Lifestyle", "Diet Preference"];

  return (
    <div className="page form-page">
      <div className="form-shell">
        <div className="form-header">
          <button className="icon-btn" onClick={onCancel} aria-label="Close"><X size={20} /></button>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} /></div>
          <span className="step-count">{step} / 4</span>
        </div>

        <h2 className="form-title" key={`title-${step}`}>{stepTitles[step - 1]}</h2>

        <div className="step-anim" key={step} data-dir={dir}>
          {step === 1 && (
            <div className="form-grid">
              <label className="field">
                <span>Age</span>
                <input type="number" placeholder="e.g. 28" value={form.age} onChange={(e) => set("age", e.target.value)} />
                {errors.age && <em className="err">{errors.age}</em>}
              </label>
              <label className="field">
                <span>Gender</span>
                <div className="pill-group">
                  {["male", "female"].map((g) => (
                    <button type="button" key={g} className={`pill ${form.gender === g ? "active" : ""}`} onClick={() => set("gender", g)}>{g === "male" ? "Male" : "Female"}</button>
                  ))}
                </div>
              </label>
              <label className="field">
                <span>Height</span>
                <div className="height-row">
                  <select value={form.heightFt} onChange={(e) => set("heightFt", e.target.value)} aria-label="Height in feet">
                    <option value="">Feet</option>
                    {[3, 4, 5, 6, 7, 8].map((f) => <option key={f} value={f}>{f} ft</option>)}
                  </select>
                  <select value={form.heightIn} onChange={(e) => set("heightIn", e.target.value)} aria-label="Height in inches">
                    {Array.from({ length: 12 }, (_, i) => i).map((i) => <option key={i} value={i}>{i} in</option>)}
                  </select>
                </div>
                {errors.heightFt && <em className="err">{errors.heightFt}</em>}
              </label>
              <label className="field">
                <span>Weight (kg)</span>
                <input type="number" placeholder="e.g. 68" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
                {errors.weight && <em className="err">{errors.weight}</em>}
              </label>
              <label className="field">
                <span>Country</span>
                <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <label className="field full">
                <span>Goal</span>
                <div className="pill-group">
                  {[["lose", "Lose Weight"], ["gain", "Gain Weight"], ["maintain", "Maintain Weight"]].map(([v, l]) => (
                    <button type="button" key={v} className={`pill ${form.goal === v ? "active" : ""}`} onClick={() => set("goal", v)}>{l}</button>
                  ))}
                </div>
              </label>
              <label className="field">
                <span>Target Weight (kg) — optional</span>
                <input type="number" placeholder="e.g. 62" value={form.targetWeight} onChange={(e) => set("targetWeight", e.target.value)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="form-grid">
              <label className="field">
                <span>Activity Level</span>
                <select value={form.activity} onChange={(e) => set("activity", e.target.value)}>
                  {Object.entries(ACTIVITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Exercise Frequency</span>
                <select value={form.exercise} onChange={(e) => set("exercise", e.target.value)}>
                  <option value="never">Never</option><option value="1-2">1–2 Days</option>
                  <option value="3-5">3–5 Days</option><option value="everyday">Everyday</option>
                </select>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="form-grid">
              <label className="field full">
                <span>Diet Preference</span>
                <div className="pill-group wrap">
                  {[["vegetarian", "Vegetarian", Salad], ["nonVegetarian", "Non-Vegetarian", Fish], ["vegan", "Vegan", Leaf], ["eggetarian", "Eggetarian", Egg]].map(([v, l, Icon]) => (
                    <button type="button" key={v} className={`pill with-icon ${form.dietPref === v ? "active" : ""}`} onClick={() => set("dietPref", v)}><Icon size={14} /> {l}</button>
                  ))}
                </div>
              </label>
              <label className="field">
                <span>Meals Per Day</span>
                <select value={form.mealsPerDay} onChange={(e) => set("mealsPerDay", e.target.value)}>
                  <option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </label>
              <label className="field">
                <span>Food Allergies — optional</span>
                <input type="text" placeholder="e.g. peanuts, shellfish" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
              </label>
              <label className="field full">
                <span>Medical Conditions</span>
                <div className="pill-group wrap">
                  {["Diabetes", "Thyroid", "High Blood Pressure", "Cholesterol", "PCOS", "Heart Disease", "None"].map((c) => (
                    <button type="button" key={c} className={`pill ${form.conditions.includes(c) ? "active" : ""}`} onClick={() => toggleCondition(c)}>{c}</button>
                  ))}
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="form-actions">
          {step > 1 ? <button className="btn btn-ghost" onClick={back}><ChevronLeft size={16} /> Back</button> : <span />}
          {step < 4
            ? <button className="btn btn-primary" onClick={next}>Continue <ChevronRight size={16} /></button>
            : <button className="btn btn-primary" onClick={submit}>Generate My Diet Plan <Sparkles size={16} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ============================== PDF GENERATION ============================== */
function generatePDF(form, results, week) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 16;
  let y = 0;
  let page = 1;

  const LEAF = [53, 99, 63], CITRUS = [214, 88, 32], INK = [20, 23, 15], MUTED = [107, 112, 98], LINE = [230, 226, 211];

  function drawFooter() {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("NutriPlan AI - Educational tool only, not a substitute for professional medical advice.", marginX, pageH - 10);
    doc.text(`Page ${page}`, pageW - marginX, pageH - 10, { align: "right" });
  }
  function ensureSpace(h) {
    if (y + h > pageH - 18) {
      drawFooter();
      doc.addPage();
      page += 1;
      y = 20;
    }
  }

  // ---- Cover / profile ----
  doc.setFillColor(...LEAF);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NutriPlan AI", marginX, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Your Personalised 7-Day Diet Plan", marginX, 24);
  doc.setFontSize(9);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, marginX, 30);

  y = 44;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Your Profile", marginX, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const goalLabel = form.goal === "lose" ? "Lose Weight" : form.goal === "gain" ? "Gain Weight" : "Maintain Weight";
  doc.text(`${form.age} yrs   |   ${form.gender === "male" ? "Male" : "Female"}   |   ${formatHeight(form)}   |   ${form.weight} kg   |   Goal: ${goalLabel}`, marginX, y);
  y += 10;

  const stats = [
    ["BMI", `${results.bmi} (${results.bmiCategory})`], ["BMR", `${results.bmr} kcal`],
    ["Daily Calories", `${results.dailyCalories} kcal`], ["Protein Target", `${results.proteinG} g`],
    ["Carbs Target", `${results.carbG} g`], ["Fat Target", `${results.fatG} g`],
    ["Water Intake", `${results.waterL} L`], ["Fiber Intake", `${results.fiberG} g`],
  ];
  const gap = 4, cols = 4, colW = (pageW - marginX * 2 - (cols - 1) * gap) / cols, rowH = 20;
  stats.forEach((s, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = marginX + col * (colW + gap), yy = y + row * (rowH + gap);
    doc.setFillColor(250, 249, 242);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, yy, colW, rowH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(String(s[1]), x + 4, yy + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(s[0], x + 4, yy + 15.5);
  });
  y += 2 * (rowH + gap) + 4;

  if (results.calorieDeficit > 0 || results.calorieSurplus > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const note = results.calorieDeficit > 0
      ? `Uses a daily deficit of ~${results.calorieDeficit} kcal from a TDEE of ${results.tdee} kcal for steady weight loss.`
      : `Uses a daily surplus of ~${results.calorieSurplus} kcal above a TDEE of ${results.tdee} kcal for healthy weight gain.`;
    const lines = doc.splitTextToSize(note, pageW - marginX * 2);
    doc.text(lines, marginX, y);
    y += lines.length * 4.4;
  }
  drawFooter();

  // ---- Each day ----
  week.forEach((d) => {
    doc.addPage(); page += 1; y = 20;
    doc.setFillColor(...CITRUS);
    doc.rect(0, 0, pageW, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${d.day} - Meal Plan`, marginX, 11);
    y = 26;

    d.meals.forEach((m) => {
      ensureSpace(36);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...MUTED);
      doc.text(`${m.label}   |   ${m.time}`, marginX, y);
      doc.setTextColor(...CITRUS);
      doc.text(`${m.cal} kcal`, pageW - marginX, y, { align: "right" });
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...INK);
      doc.text(m.name, marginX, y);
      y += 5.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(`${m.qty}   |   P ${m.p}g   C ${m.c}g   F ${m.f}g   Fiber ${m.fiber}g`, marginX, y);
      y += 5.5;
      const altLines = doc.splitTextToSize(`Alternative: ${m.alt}`, pageW - marginX * 2);
      doc.setTextColor(...INK);
      doc.text(altLines, marginX, y);
      y += altLines.length * 4.4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      const reasonLines = doc.splitTextToSize(m.reason, pageW - marginX * 2);
      doc.text(reasonLines, marginX, y);
      y += reasonLines.length * 4.1 + 4;
      doc.setDrawColor(...LINE);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;
    });
    drawFooter();
  });

  const fileSafeDate = new Date().toISOString().slice(0, 10);
  doc.save(`NutriPlan-AI-Diet-Plan-${fileSafeDate}.pdf`);
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ form, onReset, theme, setTheme }) {
  const results = useMemo(() => calculateAll(form), [form]);
  const week = useMemo(() => generateWeekPlan(form), [form]);
  const [activeDay, setActiveDay] = useState(0);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const todaysMeals = week[activeDay].meals;
  const totalCal = todaysMeals.reduce((s, m) => s + m.cal, 0);
  const totalP = todaysMeals.reduce((s, m) => s + m.p, 0);
  const totalC = todaysMeals.reduce((s, m) => s + m.c, 0);
  const totalF = todaysMeals.reduce((s, m) => s + m.f, 0);
  const chartData = todaysMeals.map((m) => ({ name: m.label.split(" ")[0], calories: m.cal }));
  const conditions = form.conditions.filter((c) => c !== "None");

  function handleDownloadPdf() {
    if (pdfLoading) return;
    setPdfLoading(true);
    // Defer so the loading state paints before the (synchronous) PDF build runs.
    setTimeout(() => {
      try {
        generatePDF(form, results, week);
        setToast("Your PDF is downloading…");
      } catch (err) {
        console.error("PDF generation failed:", err);
        setToast("Couldn't generate the PDF — please try again.");
      } finally {
        setPdfLoading(false);
      }
    }, 30);
  }
  function handleShare() {
    const summary = `NutriPlan AI — My Daily Targets\nCalories: ${results.dailyCalories} kcal\nProtein: ${results.proteinG}g | Carbs: ${results.carbG}g | Fat: ${results.fatG}g\nBMI: ${results.bmi} (${results.bmiCategory})`;
    if (navigator.share) { navigator.share({ title: "My NutriPlan AI Diet Plan", text: summary }).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(summary); setToast("Summary copied to clipboard"); }
  }

  return (
    <div className="page dashboard-page">
      <nav className="nav no-print">
        <div className="brand"><div className="brand-mark"><Leaf size={18} color="#fff" /></div><span>NutriPlan <em>AI</em></span></div>
        <div className="nav-actions">
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
          <button className="btn btn-ghost btn-sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
            {pdfLoading ? "Preparing…" : "Download PDF"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleShare}><Share2 size={15} /> Share</button>
          <button className="btn btn-secondary btn-sm" onClick={onReset}><RefreshCw size={15} /> Start Over</button>
        </div>
      </nav>

      <div className="dash-header">
        <h1>Your Personalised Plan</h1>
        <p>Based on {form.age} yrs · {form.gender === "male" ? "Male" : "Female"} · {formatHeight(form)} · {form.weight}kg · Goal: {form.goal === "lose" ? "Lose Weight" : form.goal === "gain" ? "Gain Weight" : "Maintain Weight"}</p>
      </div>

      <section className={`stat-grid ${mounted ? "in-view" : ""}`}>
        <StatCard i={0} icon={Scale} label={`BMI · ${results.bmiCategory}`} value={results.bmi} unit="" accent="var(--leaf)" />
        <StatCard i={1} icon={Flame} label="BMR" value={results.bmr} unit=" kcal" accent="var(--citrus)" />
        <StatCard i={2} icon={Activity} label="Daily Calories" value={results.dailyCalories} unit=" kcal" accent="var(--berry)" />
        <StatCard i={3} icon={Utensils} label="Protein Target" value={results.proteinG} unit=" g" accent="var(--leaf)" />
        <StatCard i={4} icon={Wheat} label="Carbs Target" value={results.carbG} unit=" g" accent="var(--citrus)" />
        <StatCard i={5} icon={Droplet} label="Fat Target" value={results.fatG} unit=" g" accent="var(--berry)" />
        <StatCard i={6} icon={Droplet} label="Water Intake" value={results.waterL} unit=" L" accent="var(--leaf)" />
        <StatCard i={7} icon={Heart} label="Fiber Intake" value={results.fiberG} unit=" g" accent="var(--citrus)" />
      </section>

      {(results.calorieDeficit > 0 || results.calorieSurplus > 0) && (
        <div className="info-banner">
          <Info size={16} />
          {results.calorieDeficit > 0 && <span>Your plan uses a daily deficit of ~{results.calorieDeficit} kcal from your TDEE of {results.tdee} kcal for steady, sustainable weight loss.</span>}
          {results.calorieSurplus > 0 && <span>Your plan uses a daily surplus of ~{results.calorieSurplus} kcal above your TDEE of {results.tdee} kcal to support healthy weight gain.</span>}
        </div>
      )}

      <section className="charts-row">
        <div className="panel-card chart-card">
          <h3>Macro Breakdown (Target)</h3>
          <div className="ring-wrap">
            <RingChart protein={results.proteinG} carb={results.carbG} fat={results.fatG} />
            <div className="ring-legend">
              <div><span className="dot" style={{ background: "var(--leaf)" }} /> Protein — {results.proteinG}g</div>
              <div><span className="dot" style={{ background: "var(--citrus)" }} /> Carbs — {results.carbG}g</div>
              <div><span className="dot" style={{ background: "var(--berry)" }} /> Fat — {results.fatG}g</div>
            </div>
          </div>
        </div>
        <div className="panel-card chart-card">
          <h3>Calorie Distribution — {week[activeDay].day}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--bg-alt)", border: "2px solid var(--rule)", borderRadius: 10, color: "var(--text)" }} />
              <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "var(--leaf)" : "var(--citrus)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mini-totals"><span>{totalCal} kcal</span><span>{totalP}g P</span><span>{totalC}g C</span><span>{totalF}g F</span></div>
        </div>
      </section>

      {conditions.length > 0 && (
        <section className="panel-card condition-card">
          <h3><ShieldCheck size={18} /> Guidance For Your Conditions</h3>
          <ul>{conditions.map((c) => <li key={c}><strong>{c}:</strong> {CONDITION_TIPS[c]}</li>)}</ul>
        </section>
      )}

      <section className="smart-tips">
        <h2 className="section-title small">Smart Recommendations</h2>
        <div className="tips-grid">
          {SMART_TIPS_BASE.map((t, i) => <div className="tip-chip" key={i}><t.icon size={16} /> {t.text}</div>)}
        </div>
      </section>

      <section className="week-tabs no-print">
        <h2 className="section-title small"><Calendar size={18} /> Weekly Planner</h2>
        <div className="tab-row">
          {week.map((d, i) => <button key={d.day} className={`tab ${activeDay === i ? "active" : ""}`} onClick={() => setActiveDay(i)}>{d.day.slice(0, 3)}</button>)}
        </div>
      </section>

      <section className="meal-list" key={activeDay}>
        <h2 className="section-title small">{week[activeDay].day}'s Meal Plan</h2>
        {todaysMeals.map((m, i) => {
          const SlotIcon = SLOT_ICON[m.slot];
          return (
          <div className="meal-card" key={m.slot} style={{ transitionDelay: `${i * 70}ms`, "--slot-color": SLOT_COLOR[m.slot] }}>
            <div className="meal-card-head">
              <div className="meal-head-left">
                <span className="meal-icon"><SlotIcon size={16} /></span>
                <div><span className="meal-slot">{m.label}</span><span className="meal-time">{m.time}</span></div>
              </div>
              <span className="meal-cal">{m.cal} kcal</span>
            </div>
            <h4>{m.name}</h4>
            <p className="meal-qty">{m.qty}</p>
            <div className="macro-row"><span>P {m.p}g</span><span>C {m.c}g</span><span>F {m.f}g</span><span>Fiber {m.fiber}g</span></div>
            <p className="meal-alt"><strong>Alternative:</strong> {m.alt}</p>
            <p className="meal-reason">{m.reason}</p>
          </div>
          );
        })}
      </section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ============================== STYLES ============================== */
const CSS = `
:root {
  --bg:#FBF9F2; --bg-alt:#FFFFFF; --ink:#14170F; --text:#14170F; --muted:#6B7062;
  --citrus:#D6581F; --on-citrus:#FFFFFF; --leaf:#2F5233; --berry:#8C2F49;
  --border:#E7E2D3; --rule:#14170F; --shadow: 0 14px 34px rgba(20,23,15,0.10);
}
/* ---- premium theme palettes (light, no dark mode) ---- */
[data-theme="ocean"] {
  --bg:#F4FAF9; --bg-alt:#FFFFFF; --ink:#0D2B2C; --text:#0D2B2C; --muted:#4F7274;
  --citrus:#D98A2B; --on-citrus:#1B1206; --leaf:#0E6E70; --berry:#1B4B6B;
  --border:#DCEBEA; --rule:#0D2B2C; --shadow: 0 14px 34px rgba(13,43,44,0.12);
}
[data-theme="sunset"] {
  --bg:#FDF5EE; --bg-alt:#FFFFFF; --ink:#2B1810; --text:#2B1810; --muted:#8A6656;
  --citrus:#C6491F; --on-citrus:#FFFFFF; --leaf:#8E3B5D; --berry:#6E2540;
  --border:#F0DFCB; --rule:#2B1810; --shadow: 0 14px 34px rgba(43,24,16,0.12);
}
[data-theme="orchid"] {
  --bg:#FBF6FA; --bg-alt:#FFFFFF; --ink:#241726; --text:#241726; --muted:#7C6884;
  --citrus:#D9A441; --on-citrus:#241726; --leaf:#6B3F76; --berry:#B75C7A;
  --border:#EBDCEE; --rule:#241726; --shadow: 0 14px 34px rgba(36,23,38,0.12);
}
* { box-sizing: border-box; }
body { margin:0; }
.app-root { position:relative; font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; transition: background .3s, color .3s; overflow-x:hidden; }
.app-root::before {
  content:""; position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:0.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size:140px 140px;
}
.page { max-width:1180px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }
.scroll-progress { position:fixed; top:0; left:0; height:3px; background:linear-gradient(90deg,var(--citrus),var(--berry)); z-index:9998; }
.view-fade { animation: crossFade .5s cubic-bezier(.2,.8,.2,1); }
.landing-root { position:relative; }
.landing-root::before {
  content:""; position:absolute; top:-140px; left:50%; transform:translateX(-50%);
  width:1100px; height:640px; pointer-events:none; z-index:0;
  background:radial-gradient(ellipse at center, rgba(255,106,43,0.09), transparent 65%);
}
h1,h2,h3,h4 { font-family:'Fraunces',serif; margin:0 0 8px; letter-spacing:-0.01em; }
p { line-height:1.65; color:var(--muted); margin:0 0 12px; }
em { font-style: italic; color: var(--citrus); }
a { color: inherit; }

/* ---- motion base ---- */
.reveal { opacity:0; transform:translateY(28px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); }
.reveal.in-view { opacity:1; transform:translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .reveal, .hero-copy, .stat-card, .meal-card, .marquee-track, .seal-ring,
  .hero-gradient-text, .eyebrow-spark, .scroll-cue, .floating-chip, .hero-mesh span { transition:none !important; animation:none !important; opacity:1 !important; transform:none !important; }
}
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes floatSlow { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-8px);} }
@keyframes marqueeScroll { from{ transform:translateX(0);} to{ transform:translateX(-50%);} }
@keyframes fadeUp { from{ opacity:0; transform:translateY(18px);} to{ opacity:1; transform:translateY(0);} }
@keyframes stepIn { from{ opacity:0; transform:translateX(var(--sx,16px));} to{ opacity:1; transform:translateX(0);} }
.step-anim[data-dir="back"] { --sx: -16px; }
@keyframes blobDrift { 0%,100%{ transform:translate(0,0) scale(1);} 33%{ transform:translate(30px,-22px) scale(1.1);} 66%{ transform:translate(-26px,16px) scale(0.92);} }
@keyframes shine { from{ transform:translateX(-60%) rotate(10deg);} to{ transform:translateX(260%) rotate(10deg);} }
@keyframes crossFade { from{ opacity:0; transform:translateY(12px);} to{ opacity:1; transform:translateY(0);} }
@keyframes popIn { 0%{ opacity:0; transform:scale(.6) rotate(-8deg);} 70%{ transform:scale(1.06) rotate(2deg);} 100%{ opacity:1; transform:scale(1) rotate(0);} }

/* ---- nav ---- */
.nav { display:flex; align-items:center; justify-content:space-between; padding:22px 0; position:sticky; top:0; z-index:40; transition: background .25s, box-shadow .25s, border-color .25s; border-bottom:2px solid transparent; }
.nav.scrolled { background:var(--bg); border-bottom:2px solid var(--border); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.brand { display:flex; align-items:center; gap:10px; font-family:'Fraunces',serif; font-size:20px; font-weight:600; color:var(--text); }
.brand-mark { width:32px; height:32px; border-radius:9px; background:var(--leaf); display:flex; align-items:center; justify-content:center; }
.nav-links { display:flex; align-items:center; gap:28px; }
.nav-links a { text-decoration:none; font-size:14.5px; font-weight:600; position:relative; }
.nav-links a::after { content:""; position:absolute; left:0; bottom:-4px; width:0; height:2px; background:var(--citrus); transition:width .25s; }
.nav-links a:hover::after { width:100%; }
.nav-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.icon-btn { width:38px; height:38px; border-radius:10px; border:2px solid var(--rule); background:var(--bg-alt); color:var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: transform .15s; }
.icon-btn:hover { transform:translateY(-2px); }
.mobile-only { display:none; }
.spin { animation: spin 1s linear infinite; }

/* ---- theme switcher ---- */
.theme-switcher { position:relative; }
.theme-trigger { position:relative; }
.theme-trigger-dot { position:absolute; bottom:-2px; right:-2px; width:9px; height:9px; border-radius:50%; border:2px solid var(--bg-alt); }
.theme-popover { position:absolute; top:calc(100% + 10px); right:0; background:var(--bg-alt); border:2px solid var(--rule); border-radius:14px; padding:10px; display:flex; flex-direction:column; gap:4px; width:200px; box-shadow: 6px 6px 0 var(--border); z-index:60; animation: fadeUp .2s ease; }
.theme-popover-title { font-size:11px; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; color:var(--muted); padding:4px 8px 6px; }
.theme-option { display:flex; align-items:center; gap:10px; padding:9px 8px; border-radius:10px; border:none; background:transparent; color:var(--text); font-size:13.5px; font-weight:600; cursor:pointer; text-align:left; transition: background .15s; }
.theme-option:hover { background:var(--bg); }
.theme-option.active { background:var(--bg); }
.theme-swatch { display:flex; gap:3px; flex-shrink:0; }
.theme-swatch i { width:11px; height:11px; border-radius:50%; display:block; border:1px solid rgba(0,0,0,0.08); }
.theme-check { margin-left:auto; color:var(--leaf); flex-shrink:0; }
.mobile-menu { position:absolute; top:100%; left:0; right:0; background:var(--bg-alt); border-bottom:3px solid var(--rule); display:flex; flex-direction:column; gap:16px; padding:20px 24px 26px; animation: fadeUp .25s ease; }
.mobile-menu a { text-decoration:none; font-weight:600; font-size:15px; }

/* ---- buttons ---- */
.btn { position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:8px; border:2px solid var(--rule); border-radius:12px; font-family:'Inter',sans-serif; font-weight:700; cursor:pointer; transition: transform .15s ease, box-shadow .15s ease; }
.btn::after { content:""; position:absolute; top:-60%; left:0; width:26%; height:220%; background:linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent); transform:translateX(-60%) rotate(10deg); pointer-events:none; }
.btn:hover::after { animation: shine .8s ease; }
.btn-primary { background:var(--citrus); color:var(--on-citrus); padding:14px 24px; font-size:15px; box-shadow: 5px 5px 0 var(--rule); }
.btn-primary:hover { transform:translate(3px,3px); box-shadow: 2px 2px 0 var(--rule); }
.btn-primary:active { transform:translate(5px,5px); box-shadow:0 0 0 var(--rule); }
.btn-lg { padding:16px 28px; font-size:16px; }
.btn-sm { padding:9px 14px; font-size:13px; box-shadow: 3px 3px 0 var(--rule); }
.btn-sm:hover { transform:translate(2px,2px); box-shadow: 1px 1px 0 var(--rule); }
.btn-ghost { background:var(--bg-alt); color:var(--text); padding:9px 14px; font-size:13px; }
.btn-ghost:hover { transform:translateY(-2px); }
.btn-secondary { background:var(--leaf); border-color:var(--rule); color:#fff; padding:9px 14px; font-size:13px; box-shadow:3px 3px 0 var(--rule); }
.btn-secondary:hover { transform:translate(2px,2px); box-shadow:1px 1px 0 var(--rule); }

/* ---- hero ---- */
.eyebrow { display:inline-flex; align-items:center; gap:6px; background:var(--bg-alt); border:2px solid var(--rule); color:var(--leaf); padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:22px; }
.hero { display:grid; grid-template-columns:1.05fr 0.95fr; gap:48px; align-items:center; padding:36px 0 90px; position:relative; }
.hero-mesh { position:absolute; inset:-40px -10px auto -10px; height:520px; z-index:0; pointer-events:none; filter:blur(52px); opacity:0.42; }
.hero-mesh span { position:absolute; border-radius:50%; }
.hero-mesh span:nth-child(1) { width:260px; height:260px; left:2%; top:4%; background:var(--citrus); animation: blobDrift 13s ease-in-out infinite; }
.hero-mesh span:nth-child(2) { width:220px; height:220px; right:6%; top:-4%; background:var(--leaf); animation: blobDrift 16s ease-in-out infinite reverse; }
.hero-mesh span:nth-child(3) { width:200px; height:200px; left:40%; bottom:-16%; background:var(--berry); animation: blobDrift 19s ease-in-out infinite; }
.hero-mesh span:nth-child(4) { width:170px; height:170px; left:70%; top:26%; background:var(--citrus); opacity:0.7; animation: blobDrift 22s ease-in-out infinite reverse; }
@media (prefers-reduced-motion: reduce) { .hero-mesh span { animation:none !important; } }
.hero-copy > * { opacity:0; transform:translateY(20px); transition: opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1); }
.hero-copy.loaded > *:nth-child(1) { transition-delay: .02s; }
.hero-copy.loaded > *:nth-child(2) { transition-delay: .10s; }
.hero-copy.loaded > *:nth-child(3) { transition-delay: .20s; }
.hero-copy.loaded > *:nth-child(4) { transition-delay: .30s; }
.hero-copy.loaded > *:nth-child(5) { transition-delay: .40s; }
.hero-copy.loaded > * { opacity:1; transform:translateY(0); }
.hero h1 { font-size:clamp(36px, 5vw, 60px); font-weight:600; line-height:1.05; margin-bottom:20px; }
.hero-gradient-text { display:inline-block; font-style:normal; background:linear-gradient(100deg, var(--leaf) 10%, var(--citrus) 55%, var(--berry) 100%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation: gradientDrift 7s ease-in-out infinite; }
@keyframes gradientDrift { 0%,100%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } }
.eyebrow-spark { animation: sparkPulse 2.4s ease-in-out infinite; }
@keyframes sparkPulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.55; transform:scale(1.15); } }
.scroll-cue { position:absolute; left:50%; bottom:10px; transform:translateX(-50%); width:38px; height:38px; border-radius:50%; border:2px solid var(--rule); background:var(--bg-alt); color:var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:2; animation: bounceDown 2.4s ease-in-out infinite; transition: transform .15s, background .15s; }
.scroll-cue:hover { background:var(--leaf); color:#fff; }
@keyframes bounceDown { 0%,100%{ transform:translate(-50%,0); } 50%{ transform:translate(-50%,6px); } }
.floating-chip { position:absolute; display:flex; align-items:center; gap:6px; background:var(--bg-alt); border:2px solid var(--rule); border-radius:999px; padding:8px 14px; font-size:12.5px; font-weight:700; color:var(--text); box-shadow:4px 4px 0 var(--border); animation: floatSlow 6s ease-in-out infinite; white-space:nowrap; }
.chip-cal { top:6%; left:-13%; color:var(--citrus); animation-delay:.3s; }
.chip-week { bottom:8%; right:-11%; color:var(--leaf); animation-delay:1.1s; }
@media (max-width:900px) { .floating-chip { display:none; } }
.hero-sub { font-size:17px; max-width:480px; }
.hero-cta-row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin:22px 0; }
.hero-note { font-size:13px; color:var(--muted); }
.hero-badges { display:flex; gap:18px; flex-wrap:wrap; margin-top:10px; }
.hero-badges span { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--leaf); font-weight:700; }
.hero-visual { position:relative; display:flex; justify-content:center; padding-top:26px; z-index:1; --rx:0deg; --ry:0deg; perspective:900px; }
.hero-visual-inner { position:relative; transition: transform .2s ease-out; transform: rotateX(var(--ry)) rotateY(var(--rx)); transform-style:preserve-3d; }
.hero-visual-inner::before { content:""; position:absolute; inset:12% -14% -14% 12%; background:radial-gradient(circle, var(--citrus) 0%, transparent 70%); opacity:0.22; filter:blur(34px); z-index:-1; }
@media (prefers-reduced-motion: reduce), (max-width:900px) { .hero-visual-inner { transform:none !important; } }

.facts-panel { background:var(--bg-alt); border:3px solid var(--rule); border-radius:20px; padding:28px 30px; box-shadow: 10px 10px 0 var(--citrus); width:100%; max-width:380px; }
.facts-eyebrow { font-family:'Big Shoulders Display'; text-transform:uppercase; letter-spacing:0.08em; font-size:13px; font-weight:700; color:var(--muted); margin-bottom:8px; }
.facts-eyebrow span { color:var(--text); font-weight:800; }
.facts-rule.thick { height:6px; background:var(--rule); margin:10px 0; border-radius:2px; }
.facts-rule.thin { height:2px; background:var(--border); margin:10px 0; }
.facts-cal-row { display:flex; justify-content:space-between; align-items:baseline; }
.facts-cal-label { font-family:'Fraunces',serif; font-size:20px; font-weight:600; }
.facts-cal-value { font-family:'Big Shoulders Display'; font-size:clamp(42px, 8vw, 60px); font-weight:800; line-height:1; }
.facts-row { display:flex; align-items:center; gap:12px; margin:12px 0; font-size:13.5px; font-weight:700; }
.facts-row > span:first-child { width:118px; flex-shrink:0; }
.facts-bar-track { flex:1; height:10px; background:var(--border); border-radius:6px; overflow:hidden; }
.facts-bar-fill { height:100%; border-radius:6px; transition: width 1.3s cubic-bezier(.2,.8,.2,1); }
.facts-pct { width:36px; text-align:right; font-family:'IBM Plex Mono',monospace; color:var(--muted); font-size:12px; font-weight:500; }
.facts-footnote { font-size:11px; color:var(--muted); margin:14px 0 0; }

.seal-badge { position:absolute; top:-22px; right:6px; width:104px; height:104px; z-index:2; animation: floatSlow 5s ease-in-out infinite; }
.seal-ring { width:100%; height:100%; animation: spin 20s linear infinite; }
.seal-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--citrus); }

/* ---- marquee ---- */
.marquee { overflow:hidden; border-top:3px solid var(--rule); border-bottom:3px solid var(--rule); background:var(--leaf); }
.marquee-track { display:flex; width:max-content; gap:0; padding:13px 0; animation: marqueeScroll 26s linear infinite; }
.marquee-item { font-family:'Big Shoulders Display'; font-weight:700; font-size:19px; letter-spacing:0.04em; text-transform:uppercase; white-space:nowrap; color:#fff; padding:0 14px; }
.marquee-item.dot { color:var(--citrus); padding:0 6px; }

/* ---- sections ---- */
.section { padding:70px 0; }
.section.alt { background:var(--bg-alt); border-radius:32px; margin:0 -4px; padding:70px 32px; border:2px solid var(--border); }
.section-title { text-align:center; font-size:clamp(26px, 4vw, 36px); margin-bottom:44px; }
.section-title.small { text-align:left; font-size:22px; margin-bottom:18px; display:flex; align-items:center; gap:8px; }

.steps-grid, .features-grid, .testimonial-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.steps-grid > *, .features-grid > *, .testimonial-grid > * { opacity:0; transform:translateY(24px); transition: opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1), border-color .2s, box-shadow .2s, translate .2s; }
.in-view .steps-grid > *, .reveal.in-view .steps-grid > *, .reveal.in-view .features-grid > *, .reveal.in-view .testimonial-grid > * { opacity:1; transform:translateY(0); }
.reveal.in-view .steps-grid > *:nth-child(1), .reveal.in-view .features-grid > *:nth-child(1), .reveal.in-view .testimonial-grid > *:nth-child(1) { transition-delay:.03s; }
.reveal.in-view .steps-grid > *:nth-child(2), .reveal.in-view .features-grid > *:nth-child(2), .reveal.in-view .testimonial-grid > *:nth-child(2) { transition-delay:.13s; }
.reveal.in-view .steps-grid > *:nth-child(3), .reveal.in-view .features-grid > *:nth-child(3), .reveal.in-view .testimonial-grid > *:nth-child(3) { transition-delay:.23s; }
.reveal.in-view .features-grid > *:nth-child(4) { transition-delay:.33s; }

.panel-card { position:relative; overflow:hidden; background:var(--bg-alt); border:2px solid var(--rule); border-radius:18px; padding:26px; box-shadow: 6px 6px 0 var(--border); transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s; }
.panel-card::after { content:""; position:absolute; top:-60%; left:-40%; width:30%; height:220%; background:linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent); transform:translateX(-40%) rotate(10deg); opacity:0; pointer-events:none; }
.panel-card:hover { transform:translate(-3px,-3px); box-shadow: 9px 9px 0 var(--border); }
.panel-card:hover::after { opacity:1; animation: shine 1s ease; }
.step-num { font-family:'Big Shoulders Display'; color:var(--leaf); font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; }
.feature-card { position:relative; }
.feature-icon { width:46px; height:46px; border-radius:12px; background:var(--leaf); color:#fff; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.feature-arrow { position:absolute; top:22px; right:22px; color:var(--muted); transition: transform .25s, color .25s; }
.feature-card:hover .feature-arrow { transform:translate(3px,-3px); color:var(--citrus); }
.testimonial .quote-icon { color:var(--border); margin-bottom:6px; }
.stars { display:flex; gap:2px; margin-bottom:10px; }
.testimonial p { font-style:italic; color:var(--text); font-size:15px; }
.testimonial-name { font-weight:700; margin-top:12px; }
.testimonial-role { font-size:12.5px; color:var(--muted); }

.faq-list { max-width:760px; margin:0 auto; }
.faq-item { border-bottom:2px solid var(--border); padding:18px 4px; cursor:pointer; }
.faq-q { display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:15.5px; }
.faq-item.open .chev { transform: rotate(90deg); color:var(--citrus); }
.chev { transition: transform .2s; }
.faq-a { margin-top:10px; color:var(--muted); font-size:14.5px; animation: fadeUp .3s ease; }

.cta-section { text-align:center; padding:80px 0; }
.cta-section h2 { font-size:34px; margin-bottom:26px; }
.footer { text-align:center; padding:40px 0 60px; border-top:2px solid var(--border); margin-top:20px; }
.footer .brand { justify-content:center; margin-bottom:14px; }
.footer-copy { font-size:12.5px; opacity:0.7; }

/* ---- form ---- */
.form-page { display:flex; align-items:center; min-height:100vh; padding-top:40px; padding-bottom:40px; }
.form-shell { background:var(--bg-alt); border:3px solid var(--rule); border-radius:24px; padding:36px; width:100%; max-width:640px; margin:0 auto; box-shadow: 8px 8px 0 var(--citrus); }
.form-header { display:flex; align-items:center; gap:16px; margin-bottom:24px; }
.progress-track { flex:1; height:8px; border-radius:4px; background:var(--border); overflow:hidden; }
.progress-fill { height:100%; background:var(--leaf); border-radius:4px; transition: width .4s cubic-bezier(.2,.8,.2,1); }
.step-count { font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); }
.form-title { font-size:27px; margin-bottom:24px; animation: fadeUp .35s ease; }
.step-anim { animation: stepIn .35s cubic-bezier(.2,.8,.2,1); }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.field { display:flex; flex-direction:column; gap:8px; font-size:13.5px; font-weight:700; color:var(--text); }
.field.full { grid-column:1 / -1; }
.field input, .field select { padding:12px 14px; border-radius:12px; border:2px solid var(--border); background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; font-size:14.5px; transition: border-color .2s; width:100%; }
.field input:focus, .field select:focus { outline:none; border-color:var(--citrus); }
.height-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.err { color:var(--berry); font-size:12px; font-weight:600; }
.pill-group { display:flex; gap:8px; flex-wrap:wrap; }
.pill-group.wrap { flex-wrap:wrap; }
.pill { padding:10px 16px; border-radius:999px; border:2px solid var(--border); background:var(--bg); color:var(--text); font-size:13.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition: all .18s; }
.pill:hover { border-color:var(--leaf); }
.pill.active { background:var(--leaf); border-color:var(--rule); color:#fff; }
.form-actions { display:flex; justify-content:space-between; margin-top:32px; }

/* ---- dashboard ---- */
.dash-header { padding:24px 0 10px; }
.dash-header h1 { font-size:clamp(26px, 4vw, 36px); }
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:28px 0; }
.stat-card { position:relative; overflow:hidden; background:var(--bg-alt); border:2px solid var(--rule); border-radius:16px; padding:18px; display:flex; align-items:center; gap:14px; box-shadow: 5px 5px 0 var(--border); opacity:0; transform:translateY(20px); transition: opacity .55s cubic-bezier(.2,.8,.2,1), transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .2s; }
.stat-grid.in-view .stat-card { opacity:1; transform:translateY(0); }
.stat-card:hover { transform:translateY(-4px); box-shadow: 7px 7px 0 var(--border); }
.stat-icon { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
.stat-card:hover .stat-icon { transform:scale(1.12) rotate(-6deg); }
.stat-value { font-family:'Big Shoulders Display'; font-size:24px; font-weight:800; }
.stat-unit { font-size:13px; color:var(--muted); margin-left:2px; font-family:'Inter',sans-serif; font-weight:500; }
.stat-label { font-size:12.5px; color:var(--muted); margin-top:2px; }
.info-banner { display:flex; align-items:center; gap:10px; background:var(--bg-alt); border:2px solid var(--rule); border-left:6px solid var(--citrus); border-radius:12px; padding:14px 18px; font-size:13.5px; color:var(--text); margin-bottom:24px; }
.charts-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
.chart-card h3 { font-size:17px; margin-bottom:14px; }
.ring-wrap { display:flex; align-items:center; gap:24px; flex-wrap:wrap; justify-content:center; }
.ring-legend { display:flex; flex-direction:column; gap:8px; font-size:13.5px; font-weight:600; }
.ring-legend div { display:flex; align-items:center; gap:8px; }
.dot { width:9px; height:9px; border-radius:50%; display:inline-block; }
.mini-totals { display:flex; gap:16px; justify-content:center; font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--muted); margin-top:10px; }
.condition-card { margin-bottom:24px; }
.condition-card h3 { display:flex; align-items:center; gap:8px; font-size:17px; }
.condition-card ul { margin:0; padding-left:18px; color:var(--muted); font-size:13.5px; line-height:1.7; }
.smart-tips { margin-bottom:28px; }
.tips-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.tip-chip { display:flex; align-items:center; gap:10px; background:var(--bg-alt); border:2px solid var(--rule); border-radius:14px; padding:12px 16px; font-size:13.5px; color:var(--text); font-weight:600; box-shadow:3px 3px 0 var(--border); }
.week-tabs { margin-bottom:12px; }
.tab-row { display:flex; gap:8px; flex-wrap:wrap; }
.tab { padding:9px 16px; border-radius:999px; border:2px solid var(--rule); background:var(--bg-alt); color:var(--text); font-weight:700; font-size:13px; cursor:pointer; transition: all .18s; }
.tab:hover { transform:translateY(-2px); }
.tab.active { background:var(--leaf); color:#fff; }
.meal-list { display:flex; flex-direction:column; gap:14px; padding-bottom:60px; }
.meal-card { position:relative; overflow:hidden; background:var(--bg-alt); border:2px solid var(--rule); border-left-width:6px; border-left-color:var(--slot-color, var(--leaf)); border-radius:16px; padding:20px; box-shadow: 4px 4px 0 var(--border); opacity:0; transform:translateY(16px); animation: fadeUp .55s cubic-bezier(.2,.8,.2,1) forwards; transition: transform .2s, box-shadow .2s; }
.meal-card:hover { transform:translate(-2px,-3px); box-shadow: 6px 7px 0 var(--border); }
.meal-card::after { content:""; position:absolute; top:-60%; left:-40%; width:26%; height:220%; background:linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent); transform:translateX(-40%) rotate(10deg); opacity:0; pointer-events:none; }
.meal-card:hover::after { opacity:1; animation: shine 1s ease; }
.meal-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.meal-head-left { display:flex; align-items:center; gap:10px; }
.meal-icon { width:32px; height:32px; border-radius:9px; background:var(--slot-color, var(--leaf)); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; animation: popIn .4s cubic-bezier(.34,1.56,.64,1); }
.meal-slot { font-family:'Big Shoulders Display'; font-weight:700; font-size:14px; color:var(--slot-color, var(--leaf)); text-transform:uppercase; letter-spacing:0.04em; margin-right:10px; }
.meal-time { font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted); }
.meal-cal { font-family:'Big Shoulders Display'; font-weight:800; font-size:18px; color:var(--citrus); }
.meal-card h4 { font-size:19px; margin-bottom:4px; }
.meal-qty { font-size:13px; margin-bottom:8px; }
.macro-row { display:flex; gap:14px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); margin-bottom:10px; }
.meal-alt { font-size:13px; margin-bottom:4px; }
.meal-reason { font-size:13px; font-style:italic; color:var(--muted); margin-bottom:0; }

.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--leaf); color:#fff; padding:12px 20px; border-radius:12px; display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; box-shadow:5px 5px 0 var(--rule); z-index:50; animation: fadeUp .3s ease; }

@media print {
  .no-print { display:none !important; }
  .dashboard-page { padding:0; }
  body { background:#fff; }
  .app-root::before { display:none; }
}

/* ============================== RESPONSIVE — ALL SCREEN SIZES ============================== */

/* Large tablets / small laptops */
@media (max-width: 1100px) {
  .page { padding:0 20px; }
  .hero { gap:32px; }
  .stat-grid { grid-template-columns:repeat(3,1fr); }
}

/* Tablets */
@media (max-width: 900px) {
  .hero { grid-template-columns:1fr; padding-bottom:60px; text-align:left; }
  .hero-visual { padding-top:36px; }
  .steps-grid, .features-grid, .testimonial-grid, .charts-row, .tips-grid { grid-template-columns:1fr 1fr; }
  .stat-grid { grid-template-columns:repeat(2,1fr); }
  .form-grid { grid-template-columns:1fr; }
  .nav-links { display:none; }
  .mobile-only { display:flex; }
  .section.alt { padding:56px 22px; margin:0; border-radius:24px; }
  .section { padding:52px 0; }
  .theme-popover { right:0; }
}

/* Large phones / small tablets */
@media (max-width: 700px) {
  .nav { padding:16px 0; }
  .nav-actions { gap:8px; }
  .dash-header h1 { font-size:28px; }
  .charts-row { grid-template-columns:1fr; }
  .facts-panel { max-width:360px; }
}

/* Phones */
@media (max-width: 560px) {
  .stat-grid, .tips-grid, .steps-grid, .features-grid, .testimonial-grid { grid-template-columns:1fr; }
  .section-title { font-size:clamp(22px, 6vw, 27px); }
  .facts-panel { max-width:100%; padding:22px 20px; }
  .seal-badge { display:none; }
  .hero-visual-inner { transform:none !important; }
  .hero-cta-row { flex-direction:column; align-items:flex-start; gap:10px; }
  .hero-badges { gap:10px 16px; }
  .form-shell { padding:24px 20px; border-width:2px; box-shadow:5px 5px 0 var(--citrus); }
  .btn-lg { width:100%; justify-content:center; }
  .nav-actions .btn-ghost.btn-sm, .nav-actions .btn-secondary.btn-sm { padding:9px 10px; }
  .toast { width:calc(100% - 32px); justify-content:center; text-align:center; }
  .theme-popover { width:min(220px, calc(100vw - 32px)); }
  .scroll-cue { display:none; }
}

/* Small phones */
@media (max-width: 380px) {
  .page { padding:0 14px; }
  .brand span { font-size:17px; }
  .hero-note { display:block; margin-top:6px; }
  .dash-header h1 { font-size:24px; }
  .form-title { font-size:22px; }
  .pill { padding:8px 12px; font-size:12.5px; }
  .btn-sm { padding:8px 11px; font-size:12px; }
}
`;

/* ============================== APP ROOT ============================== */
export default function App() {
  useFonts();
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "sage";
    try { return window.localStorage.getItem(THEME_STORAGE_KEY) || "sage"; } catch { return "sage"; }
  });
  const [view, setView] = useState("landing");
  const [finalForm, setFinalForm] = useState(null);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* ignore (e.g. private mode) */ }
  }, [theme]);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setScrollPct(total > 0 ? (h.scrollTop / total) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  function handleComplete(form) { setFinalForm(form); setView("dashboard"); window.scrollTo(0, 0); }
  function handleReset() { setFinalForm(null); setView("landing"); window.scrollTo(0, 0); }

  return (
    <div className="app-root" data-theme={theme}>
      <style>{CSS}</style>
      <div className="scroll-progress no-print" style={{ width: `${scrollPct}%` }} />
      <div className="view-fade" key={view}>
        {view === "landing" && <Landing onStart={() => setView("form")} theme={theme} setTheme={setTheme} />}
        {view === "form" && <FormFlow onComplete={handleComplete} onCancel={() => setView("landing")} />}
        {view === "dashboard" && finalForm && <Dashboard form={finalForm} onReset={handleReset} theme={theme} setTheme={setTheme} />}
      </div>
    </div>
  );
}
