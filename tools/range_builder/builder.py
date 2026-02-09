import tkinter as tk
from tkinter import filedialog, messagebox
import json
import os
import sys

# --- CONFIGURACIÓN ---
ACTION_COLORS = {
    "FOLD": "#e0e0e0", 
    "OPEN": "#4CAF50",   # VERDE
    "CALL": "#2196F3",   # AZUL
    "CALL3B": "#00BCD4", # CIAN
    "RAISE": "#ff9800",  # Naranja
    "OVERBET": "#8B0000", # ROJO OSCURO
    "3BET": "#f44336",   # Rojo
    "4BET": "#9C27B0",   # Morado
    "5BET": "#E91E63",   # Rosa
    "ALLIN": "#FFD700"   # Dorado
}

# Fuentes
FONT_HAND_LABEL = ("Arial", 8, "bold") 
FONT_DETAIL = ("Arial", 7, "bold")     

class RangeBuilder(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Creador de Rangos - Sin Archivo")
        self.geometry("1280x850") 
        
        # --- ESTADO DEL ARCHIVO ---
        self.current_file_path = None 
        
        # Estado de la estrategia
        self.current_strategy = {} 
        
        # Valores por defecto (4 Capas)
        self.act1, self.pct1 = "OPEN", 100.0
        self.act2, self.pct2 = "CALL", 0.0
        self.act3, self.pct3 = "FOLD", 0.0 
        self.act4, self.pct4 = "FOLD", 0.0 
        
        self.last_dragged_hand = None
        
        # Estado Visual (Modo Oscuro)
        self.is_dark_mode = False
        
        # Colores de Tema
        self.colors = {
            "light": {"bg": "#f0f0f0", "fg": "black", "panel": "#e0e0e0", "grid": "white", "empty_cell": "white"},
            "dark":  {"bg": "#2b2b2b", "fg": "white", "panel": "#383838", "grid": "#1e1e1e", "empty_cell": "#404040"}
        }

        # Referencias UI
        self.btns_act1 = {}
        self.btns_act2 = {}
        self.btns_act3 = {}
        self.btns_act4 = {}
        self.hand_canvases = {} 
        self.stats_labels = {} 
        
        self.main_frames = []
        self.main_labels = []
        
        self.create_ui()
        self.update_ui_state()
        self.update_stats()
        self.apply_theme() 
        
        # Atajo de teclado para Guardar (Ctrl + S)
        self.bind('<Control-s>', lambda event: self.quick_save())

    def create_ui(self):
        # PANEL IZQUIERDO
        self.left_panel = tk.Frame(self, padx=10, pady=10, width=320)
        self.left_panel.pack(side="left", fill="y", anchor="n")
        self.main_frames.append(self.left_panel)
        
        self.btn_theme = tk.Button(self.left_panel, text="🌙 MODO OSCURO", command=self.toggle_dark_mode, bg="#555", fg="white")
        self.btn_theme.pack(fill="x", pady=(0, 15))

        self.add_layer_ui(1, "CAPA 1 (Prioridad Alta)", "100.0", self.left_panel)
        self.add_layer_ui(2, "CAPA 2 (Media)", "0.0", self.left_panel)
        self.add_layer_ui(3, "CAPA 3 (Baja)", "0.0", self.left_panel)
        self.add_layer_ui(4, "CAPA 4 (Resto)", "0.0", self.left_panel)

        self.spin1.bind('<Return>', self.on_enter_spin1)
        self.spin2.bind('<Return>', self.on_enter_spin2)
        self.spin3.bind('<Return>', self.on_enter_spin3)
        self.spin4.bind('<Return>', self.on_enter_spin4)

        self.lbl_total = tk.Label(self.left_panel, text="Total: 100.0%", font=("Arial", 10, "bold"), fg="#4CAF50")
        self.lbl_total.pack(pady=(5, 10))
        self.main_labels.append(self.lbl_total)

        tk.Frame(self.left_panel, height=2, bg="#aaa").pack(fill="x", pady=5)

        lbl_stats_title = tk.Label(self.left_panel, text="ESTADÍSTICAS", font=("Arial", 11, "bold"))
        lbl_stats_title.pack(pady=(0, 5))
        self.main_labels.append(lbl_stats_title)
        
        self.stats_frame = tk.Frame(self.left_panel, bd=1, relief="sunken", padx=5, pady=5)
        self.stats_frame.pack(fill="x", pady=5)
        
        row_idx, col_idx = 0, 0
        for action, color in ACTION_COLORS.items():
            cell_frame = tk.Frame(self.stats_frame)
            cell_frame.grid(row=row_idx, column=col_idx, sticky="w", padx=2, pady=1)
            tk.Label(cell_frame, bg=color, width=2).pack(side="left", padx=(0,2))
            lbl = tk.Label(cell_frame, text=f"{action}: 0.0%", font=("Consolas", 8))
            lbl.pack(side="left")
            self.stats_labels[action] = lbl
            col_idx += 1
            if col_idx > 1:
                col_idx = 0
                row_idx += 1
        
        self.lbl_vpip = tk.Label(self.left_panel, text="VPIP: 0.0%", font=("Arial", 12, "bold"), fg="#4CAF50")
        self.lbl_vpip.pack(pady=10)

        # PANEL DERECHO
        self.right_main_frame = tk.Frame(self, padx=10, pady=10)
        self.right_main_frame.pack(side="right", expand=True, fill="both")
        self.main_frames.append(self.right_main_frame)

        self.grid_frame = tk.Frame(self.right_main_frame)
        self.grid_frame.pack(side="top", expand=True, fill="both")
        
        ranks = "AKQJT98765432"
        for r1_idx, r1 in enumerate(ranks):
            for r2_idx, r2 in enumerate(ranks):
                if r1_idx < r2_idx: hand = f"{r1}{r2}s"
                elif r1_idx > r2_idx: hand = f"{r2}{r1}o"
                else: hand = f"{r1}{r2}"
                
                canvas = tk.Canvas(self.grid_frame, width=55, height=45, highlightthickness=1, highlightbackground="#ccc")
                canvas.hand_name = hand
                
                canvas.bind('<Button-1>', lambda e, h=hand: self.paint_hand(h))
                canvas.bind('<Button-3>', lambda e, h=hand: self.load_hand_stats(h))
                canvas.bind('<B1-Motion>', self.drag_paint)
                canvas.bind('<B3-Motion>', self.drag_clear)
                canvas.bind('<ButtonRelease-1>', self.reset_drag)
                canvas.bind('<ButtonRelease-3>', self.reset_drag)
                
                canvas.grid(row=r1_idx, column=r2_idx, padx=1, pady=1)
                self.hand_canvases[hand] = canvas
                self.draw_cell(hand, [{"action": "FOLD", "weight": 100}], is_empty=True)

        self.bottom_actions_frame = tk.Frame(self.right_main_frame, pady=10)
        self.bottom_actions_frame.pack(side="bottom", fill="x")
        self.main_frames.append(self.bottom_actions_frame)

        btn_opts = {'font': ("Arial", 9, "bold"), 'height': 2, 'width': 18}
        tk.Button(self.bottom_actions_frame, text="📂 CARGAR", command=self.load_json_dialog, **btn_opts).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(self.bottom_actions_frame, text="💾 GUARDAR (Ctrl+S)", bg="#4CAF50", fg="white", command=self.quick_save, **btn_opts).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(self.bottom_actions_frame, text="💾 GUARDAR NUEVO...", bg="#2196F3", fg="white", command=self.save_as_json, **btn_opts).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(self.bottom_actions_frame, text="🗑️ LIMPIAR TODO", bg="#d32f2f", fg="white", command=self.clear_grid, **btn_opts).pack(side="left", padx=5, expand=True, fill="x")

    def add_layer_ui(self, layer_idx, title_text, default_val, parent):
        lbl = tk.Label(parent, text=title_text, font=("bold", 10), anchor="w")
        lbl.pack(fill="x", pady=(2,1))
        self.main_labels.append(lbl)

        frame = tk.Frame(parent)
        frame.pack(fill="x")
        self.main_frames.append(frame)
        self.create_action_buttons(frame, layer_idx)
        
        sub_frame = tk.Frame(parent)
        sub_frame.pack(fill="x", pady=(0, 5))
        self.main_frames.append(sub_frame)

        lbl_w = tk.Label(sub_frame, text=f"Peso (%):", font=("Arial", 8))
        lbl_w.pack(side="left", padx=(0,5))
        self.main_labels.append(lbl_w)

        spin = tk.Spinbox(sub_frame, from_=0, to=100, increment=0.1, font=("Consolas", 11), width=8)
        spin.delete(0, "end")
        spin.insert(0, default_val)
        spin.pack(side="right", fill="x", expand=True)
        self.setup_spinbox(spin)
        
        if layer_idx == 1: self.spin1 = spin
        elif layer_idx == 2: self.spin2 = spin
        elif layer_idx == 3: self.spin3 = spin
        elif layer_idx == 4: self.spin4 = spin

    def setup_spinbox(self, spinbox):
        spinbox.bind('<KeyRelease>', self.update_inputs_logic)
        spinbox.bind('<ButtonRelease-1>', self.update_inputs_logic)
        spinbox.bind('<FocusIn>', self.auto_select_text)

    def create_action_buttons(self, parent, layer_idx):
        row, col = 0, 0
        keys = list(ACTION_COLORS.keys())
        target_dict = getattr(self, f"btns_act{layer_idx}")

        for act in keys:
            btn = tk.Button(parent, text=act, width=5, font=("Arial", 6, "bold"),
                            command=lambda a=act, l=layer_idx: self.set_action(a, l))
            btn.grid(row=row, column=col, padx=1, pady=1)
            target_dict[act] = btn
            col += 1
            if col > 2:
                col = 0
                row += 1

    def on_enter_spin1(self, event): self.update_inputs_logic(); self.spin2.focus_set(); return "break"
    def on_enter_spin2(self, event): self.update_inputs_logic(); self.spin3.focus_set(); return "break"
    def on_enter_spin3(self, event): self.update_inputs_logic(); self.spin4.focus_set(); return "break"
    def on_enter_spin4(self, event): self.update_inputs_logic(); return "break"

    def auto_select_text(self, event): event.widget.after(50, lambda: event.widget.selection_range(0, tk.END))

    def get_spin_value(self, spinbox):
        try: return max(0.0, float(spinbox.get().replace(',', '.')))
        except ValueError: return 0.0

    def load_hand_stats(self, hand):
        actions = self.current_strategy.get(hand, [])
        self.pct1, self.pct2, self.pct3, self.pct4 = 0.0, 0.0, 0.0, 0.0
        
        if actions:
            if len(actions) > 0: self.act1, self.pct1 = actions[0]['action'], float(actions[0]['weight'])
            if len(actions) > 1: self.act2, self.pct2 = actions[1]['action'], float(actions[1]['weight'])
            if len(actions) > 2: self.act3, self.pct3 = actions[2]['action'], float(actions[2]['weight'])
            if len(actions) > 3: self.act4, self.pct4 = actions[3]['action'], float(actions[3]['weight'])

        for i, val in enumerate([self.pct1, self.pct2, self.pct3, self.pct4], 1):
            spin = getattr(self, f"spin{i}")
            spin.delete(0, "end")
            spin.insert(0, f"{val:.1f}")
        
        self.update_ui_state() 
        self.update_inputs_logic() 

    def update_inputs_logic(self, event=None):
        self.pct1 = self.get_spin_value(self.spin1)
        self.pct2 = self.get_spin_value(self.spin2)
        self.pct3 = self.get_spin_value(self.spin3)
        self.pct4 = self.get_spin_value(self.spin4)
        
        total = self.pct1 + self.pct2 + self.pct3 + self.pct4
        self.lbl_total.config(text=f"Total: {total:.1f}%")
        self.lbl_total.config(fg="#4CAF50" if 99.9 <= total <= 100.1 else "#f44336")

    def toggle_dark_mode(self):
        self.is_dark_mode = not self.is_dark_mode
        self.apply_theme()

    def apply_theme(self):
        theme = "dark" if self.is_dark_mode else "light"
        c = self.colors[theme]
        self.configure(bg=c["bg"])
        self.left_panel.configure(bg=c["panel"])
        self.right_main_frame.configure(bg=c["bg"])
        self.bottom_actions_frame.configure(bg=c["bg"])
        self.grid_frame.configure(bg=c["bg"])
        self.stats_frame.configure(bg=c["panel"])
        for f in self.main_frames: f.configure(bg=c["panel"])
        for l in self.main_labels: l.configure(bg=c["panel"], fg=c["fg"])
        for l in self.stats_labels.values():
            l.configure(bg=c["panel"], fg=c["fg"])
            l.master.configure(bg=c["panel"])
        self.update_ui_state()
        self.btn_theme.config(text="☀️ MODO CLARO" if self.is_dark_mode else "🌙 MODO OSCURO", bg="#444" if self.is_dark_mode else "#ddd", fg="white" if self.is_dark_mode else "black")
        self.redraw_all_grid()

    def redraw_all_grid(self):
        for hand, actions in self.current_strategy.items(): self.draw_cell(hand, actions)
        for hand in self.hand_canvases:
            if hand not in self.current_strategy: self.draw_cell(hand, [], is_empty=True)

    def set_action(self, action, layer_idx):
        setattr(self, f"act{layer_idx}", action)
        self.update_ui_state()

    def update_ui_state(self):
        self.update_buttons_in_layer(self.btns_act1, self.act1)
        self.update_buttons_in_layer(self.btns_act2, self.act2)
        self.update_buttons_in_layer(self.btns_act3, self.act3)
        self.update_buttons_in_layer(self.btns_act4, self.act4)

    def update_buttons_in_layer(self, btn_dict, selected_act):
        bg_in = "#555" if self.is_dark_mode else "#ddd"
        fg_in = "white" if self.is_dark_mode else "black"
        for act, btn in btn_dict.items():
            if act == selected_act: btn.config(bg=ACTION_COLORS[act], relief="sunken", bd=3, fg="black")
            else: btn.config(bg=bg_in, relief="raised", bd=1, fg=fg_in)

    def paint_hand(self, hand, force_fold=False):
        if force_fold:
            if hand in self.current_strategy: del self.current_strategy[hand]
            self.draw_cell(hand, [{"action": "FOLD", "weight": 100}], is_empty=True)
        else:
            self.update_inputs_logic()
            raw_total = self.pct1 + self.pct2 + self.pct3 + self.pct4
            actions = []
            if raw_total > 0:
                factor = 100.0 / raw_total
                if self.pct1 > 0: actions.append({"action": self.act1, "weight": round(self.pct1 * factor, 1)})
                if self.pct2 > 0: actions.append({"action": self.act2, "weight": round(self.pct2 * factor, 1)})
                if self.pct3 > 0: actions.append({"action": self.act3, "weight": round(self.pct3 * factor, 1)})
                if self.pct4 > 0: actions.append({"action": self.act4, "weight": round(self.pct4 * factor, 1)})
            else: actions.append({"action": "FOLD", "weight": 100})
            self.current_strategy[hand] = actions
            self.draw_cell(hand, actions)
        self.update_stats()

    def draw_cell(self, hand, action_list, is_empty=False):
        canvas = self.hand_canvases[hand]
        canvas.delete("all") 
        w, h = int(canvas['width']), int(canvas['height'])
        theme = "dark" if self.is_dark_mode else "light"
        
        if is_empty:
            canvas.configure(bg=self.colors[theme]["empty_cell"])
            canvas.create_text(w/2, h/2, text=hand, font=("Arial", 10), fill="#999" if not self.is_dark_mode else "#777")
            return

        current_y = 0
        for item in action_list:
            weight = item['weight']
            color = ACTION_COLORS.get(item['action'], "#ccc")
            rect_h = h * (weight / 100.0)
            canvas.create_rectangle(0, current_y, w, current_y + rect_h, fill=color, outline="")
            if rect_h > 10:
                canvas.create_text(w-2, max(current_y + rect_h/2, 6), text=f"{weight:g}%", font=FONT_DETAIL, fill="black", anchor="e")
            current_y += rect_h
        canvas.create_text(3, 3, text=hand, font=FONT_HAND_LABEL, anchor="nw", fill="black")

    def drag_paint(self, event): self.handle_drag(event, False)
    def drag_clear(self, event): self.handle_drag(event, True)
    def reset_drag(self, event): self.last_dragged_hand = None

    def handle_drag(self, event, force_fold):
        x, y = self.winfo_pointerxy()
        widget = self.winfo_containing(x, y)
        if widget and hasattr(widget, 'hand_name'):
            hand = widget.hand_name
            if hand != self.last_dragged_hand:
                self.paint_hand(hand, force_fold=force_fold)
                self.last_dragged_hand = hand

    def update_stats(self):
        total = 1326.0
        counts = {act: 0.0 for act in ACTION_COLORS.keys()}
        painted = 0
        for hand, actions in self.current_strategy.items():
            base = 6 if len(hand)==2 else (4 if hand.endswith('s') else 12)
            painted += base
            for act in actions: counts[act['action']] += base * (act['weight'] / 100.0)
        
        counts["FOLD"] += (total - painted)
        non_fold = sum(v for k,v in counts.items() if k != "FOLD")
        for act, val in counts.items():
            if act in self.stats_labels: self.stats_labels[act].config(text=f"{act}: {(val/total)*100:.2f}%")
        self.lbl_vpip.config(text=f"VPIP: {(non_fold/total)*100:.2f}%")

    def clear_grid(self):
        self.current_strategy = {}
        self.redraw_all_grid()
        self.update_stats()
        self.current_file_path = None
        self.title("Creador de Rangos - Sin Archivo")

    def quick_save(self):
        if self.current_file_path: self.write_to_file(self.current_file_path)
        else: self.save_as_json()

    def save_as_json(self):
        initial_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'preflop_ranges')
        if not os.path.exists(initial_dir): os.makedirs(initial_dir)
        path = filedialog.asksaveasfilename(initialdir=initial_dir, title="Guardar Como", defaultextension=".json", filetypes=[("JSON", "*.json")])
        if path: self.write_to_file(path)

    def write_to_file(self, path):
        try:
            with open(path, 'w') as f: json.dump({"info": "Builder V3.8", "strategy": self.current_strategy}, f, indent=4)
            self.current_file_path = path
            self.title(f"Editando: {os.path.basename(path)}")
            messagebox.showinfo("Guardado", f"OK: {os.path.basename(path)}")
        except Exception as e: messagebox.showerror("Error", str(e))

    def load_from_path(self, path):
        """Carga directa desde ruta (usado por el Visor)"""
        try:
            with open(path, 'r') as f: data = json.load(f)
            
            # Buscar estrategia recursivamente si es necesario
            strategy = data.get("strategy", {})
            # Si strategy está vacía, intentar buscarla
            if not strategy:
                def find_s(d):
                    if isinstance(d, dict):
                        if "AA" in d: return d
                        for v in d.values():
                            r = find_s(v)
                            if r: return r
                    return None
                strategy = find_s(data) or {}

            self.current_strategy = {}
            for hand, content in strategy.items():
                action_list = []
                if isinstance(content, list): action_list = content
                elif isinstance(content, dict): # Caso dict {"Raise": 100}
                    for k, v in content.items():
                        if v > 0: action_list.append({"action": k.upper(), "weight": v})
                
                self.current_strategy[hand] = action_list
            
            self.redraw_all_grid()
            self.update_stats()
            self.current_file_path = path
            self.title(f"Editando: {os.path.basename(path)}")
            print(f"Archivo cargado: {path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo cargar {path}:\n{e}")

    def load_json_dialog(self):
        initial_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'preflop_ranges')
        path = filedialog.askopenfilename(initialdir=initial_dir, filetypes=[("JSON", "*.json")])
        if path: self.load_from_path(path)

if __name__ == "__main__":
    app = RangeBuilder()
    
    # --- AUTO-CARGA SI HAY ARGUMENTOS ---
    if len(sys.argv) > 1:
        file_to_load = sys.argv[1]
        if os.path.exists(file_to_load):
            # Usar 'after' para asegurar que la UI esté lista antes de cargar
            app.after(100, lambda: app.load_from_path(file_to_load))
            
    app.mainloop()