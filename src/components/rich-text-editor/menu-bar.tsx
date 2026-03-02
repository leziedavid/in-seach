"use client";

import { Icon } from "@iconify/react";
import { Editor } from "@tiptap/react";
import { Toggle } from "../ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
export default function MenuBar({ editor }: { editor: Editor | null }) {

  const [color, setColor] = useState("#000000");
  const [font, setFont] = useState("Georgia");

  if (!editor) return null;

  const Options = [
    { icon: <span className="font-bold text-xs">H1</span>, onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), preesed: editor.isActive("heading", { level: 1 }) },
    { icon: <span className="font-bold text-xs">H2</span>, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), preesed: editor.isActive("heading", { level: 2 }) },
    { icon: <span className="font-bold text-xs">H3</span>, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), preesed: editor.isActive("heading", { level: 3 }) },
    { icon: <Icon icon="solar:text-bold-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleBold().run(), preesed: editor.isActive("bold") },
    { icon: <Icon icon="solar:text-italic-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleItalic().run(), preesed: editor.isActive("italic") },
    { icon: <Icon icon="solar:text-strikethrough-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleStrike().run(), preesed: editor.isActive("strike") },
    { icon: <Icon icon="solar:align-left-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().setTextAlign("left").run(), preesed: editor.isActive({ textAlign: "left" }) },
    { icon: <Icon icon="solar:align-center-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().setTextAlign("center").run(), preesed: editor.isActive({ textAlign: "center" }) },
    { icon: <Icon icon="solar:align-right-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().setTextAlign("right").run(), preesed: editor.isActive({ textAlign: "right" }) },
    { icon: <Icon icon="solar:list-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleBulletList().run(), preesed: editor.isActive("bulletList") },
    { icon: <Icon icon="solar:list-ordered-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleOrderedList().run(), preesed: editor.isActive("orderedList") },
    { icon: <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />, onClick: () => editor.chain().focus().toggleHighlight().run(), preesed: editor.isActive("highlight") },
  ];

  const handleColorChange = (value: string) => {
    setColor(value);
    editor.chain().focus().setColor(value).run();
  };

  const handleFontChange = (value: string) => {
    setFont(value);
    editor.chain().focus().setFontFamily(value).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-card/50 backdrop-blur-xl border border-border rounded-xl mb-3 z-50 ">
      {/* Buttons principales */}
      {Options.map((option, idx) => (
        <Toggle
          key={idx}
          pressed={option.preesed}
          onPressedChange={option.onClick}
          className="h-8 w-8 rounded-lg transition-all data-[state=on]:bg-primary/20 data-[state=on]:text-primary hover:bg-muted"
        >
          {option.icon}
        </Toggle>
      ))}
      {/* Sélecteur couleur */}
      <div className="relative w-8 h-8 rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all flex items-center justify-center bg-card">
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
          title="Couleur du texte"
        />
        <div className="w-4 h-4 rounded-full border border-border " style={{ backgroundColor: color }} />
      </div>
      {/* Sélecteur police avec ShadCN */}
      <Select value={font} onValueChange={handleFontChange}>
        <SelectTrigger className="w-32 h-8 border border-border rounded-lg px-2 text-[11px] font-bold bg-muted/30 hover:bg-muted transition-all text-foreground">
          <SelectValue placeholder="Police" />
        </SelectTrigger>
        <SelectContent className="bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-xl">
          {["Georgia", "Arial", "Verdana", "Times New Roman", "Courier New"].map(f => (
            <SelectItem key={f} value={f} className="text-xs hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1">{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
