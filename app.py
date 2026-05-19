import os
import io
import base64
from flask import Flask, render_template, request, jsonify, send_from_directory
import networkx as nx
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

app = Flask(__name__)

def calculate_cpm(activities):
    # activities: list of dicts {name, pred, a, m, b}
    G = nx.DiGraph()
    
    # 1. Build Node Data and Basic Graph
    node_data = {}
    for act in activities:
        name = act['name'].strip()
        if not name: continue
        
        a = float(act['a'])
        m = float(act['m'])
        b = float(act['b'])
        te = (a + 4*m + b) / 6
        
        node_data[name] = {
            'name': name,
            'te': round(te, 2),
            'preds': [p.strip() for p in act['pred'].split(',') if p.strip()],
            'es': 0, 'ef': 0, 'ls': 0, 'lf': 0, 'tf': 0, 'ff': 0
        }
        G.add_node(name)

    # 2. Add Edges and check for missing predecessors
    for name, data in node_data.items():
        for pred in data['preds']:
            if pred not in node_data:
                raise ValueError(f"Predecessor '{pred}' for activity '{name}' not found.")
            G.add_edge(pred, name)

    # 3. Cycle Detection
    if not nx.is_directed_acyclic_graph(G):
        raise ValueError("Network contains a cycle (circular dependency detected).")

    # 4. Topological Sort for Forward Pass
    topo_order = list(nx.topological_sort(G))
    
    # Forward Pass
    for name in topo_order:
        data = node_data[name]
        if not data['preds']:
            data['es'] = 0
        else:
            data['es'] = max(node_data[p]['ef'] for p in data['preds'])
        data['ef'] = round(data['es'] + data['te'], 2)

    project_duration = max(node_data[name]['ef'] for name in node_data) if node_data else 0

    # Backward Pass
    for name in reversed(topo_order):
        data = node_data[name]
        successors = list(G.successors(name))
        if not successors:
            data['lf'] = project_duration
        else:
            data['lf'] = min(node_data[s]['ls'] for s in successors)
        data['ls'] = round(data['lf'] - data['te'], 2)
        data['tf'] = round(data['lf'] - data['ef'], 2)

    # Free Float Calculation
    for name in topo_order:
        data = node_data[name]
        successors = list(G.successors(name))
        if not successors:
            data['ff'] = round(project_duration - data['ef'], 2)
        else:
            data['ff'] = round(min(node_data[s]['es'] for s in successors) - data['ef'], 2)

    critical_path = [name for name, d in node_data.items() if d['tf'] == 0]
    
    return list(node_data.values()), critical_path, project_duration, G

def generate_graph_base64(G, node_data, critical_path, theme='dark-slate'):
    theme_configs = {
        'dark-slate': {
            'fig_bg': '#0b0f19',
            'node_normal': '#151b2c',
            'node_critical': '#f43f5e',
            'border_normal': '#38bdf8',
            'border_critical': '#ffffff',
            'text_color': '#ffffff',
            'edge_normal': '#334155',
            'edge_critical': '#f43f5e',
            'box_bg': '#151b2c',
            'box_border': '#1e293b',
            'box_text': '#f8fafc'
        },
        'dark-neon': {
            'fig_bg': '#07070a',
            'node_normal': '#11131e',
            'node_critical': '#ec4899',
            'border_normal': '#10b981',
            'border_critical': '#ffffff',
            'text_color': '#ffffff',
            'edge_normal': '#374151',
            'edge_critical': '#ec4899',
            'box_bg': '#11131e',
            'box_border': '#1f2937',
            'box_text': '#ffffff'
        },
        'light-nordic': {
            'fig_bg': '#f3f4f6',
            'node_normal': '#ffffff',
            'node_critical': '#be123c',
            'border_normal': '#1e40af',
            'border_critical': '#ffffff',
            'text_color': '#111827',
            'edge_normal': '#cbd5e1',
            'edge_critical': '#be123c',
            'box_bg': '#ffffff',
            'box_border': '#e5e7eb',
            'box_text': '#111827'
        },
        'light-sunset': {
            'fig_bg': '#f0fdf4',
            'node_normal': '#ffffff',
            'node_critical': '#b91c1c',
            'border_normal': '#15803d',
            'border_critical': '#b91c1c',
            'text_color': '#14532d',
            'edge_normal': '#86efac',
            'edge_critical': '#b91c1c',
            'box_bg': '#ffffff',
            'box_border': '#86efac',
            'box_text': '#14532d'
        }
    }
    
    cfg = theme_configs.get(theme, theme_configs['dark-slate'])
    
    plt.figure(figsize=(14, 8), facecolor=cfg['fig_bg'])
    
    # Calculate Layers (Topological Depth)
    levels = {}
    topo_order = list(nx.topological_sort(G))
    for node in topo_order:
        preds = list(G.predecessors(node))
        levels[node] = 0 if not preds else max(levels[p] for p in preds) + 1
            
    # Group nodes by level
    nodes_by_level = {}
    for node, level in levels.items():
        if level not in nodes_by_level:
            nodes_by_level[level] = []
        nodes_by_level[level].append(node)
        
    # Manually calculate positions for a strict left-to-right flow
    pos = {}
    for level, nodes in nodes_by_level.items():
        x = level * 2.0  # Increase horizontal spacing
        num_nodes = len(nodes)
        for i, node in enumerate(nodes):
            if num_nodes > 1:
                y = (i - (num_nodes - 1) / 2) * 1.8 # Spacing between nodes in same level
            else:
                y = 0
            pos[node] = np.array([x, y])

    # Node Colors & Styles
    node_colors = []
    node_edge_colors = []
    for node in G.nodes():
        if node in critical_path:
            node_colors.append(cfg['node_critical'])
            node_edge_colors.append(cfg['border_critical'])
        else:
            node_colors.append(cfg['node_normal'])
            node_edge_colors.append(cfg['border_normal'])

    # Edge Colors (Straight Arrows)
    edge_colors = []
    edge_widths = []
    for u, v in G.edges():
        if u in critical_path and v in critical_path and node_data[v]['tf'] == 0 and node_data[u]['tf'] == 0:
             edge_colors.append(cfg['edge_critical'])
             edge_widths.append(3.0)
        else:
             edge_colors.append(cfg['edge_normal'])
             edge_widths.append(1.5)

    # Draw Straight Edges with Arrows
    nx.draw_networkx_edges(G, pos, edge_color=edge_colors, width=edge_widths, 
                           arrowstyle='-|>', arrowsize=30, 
                           connectionstyle='arc3,rad=0', alpha=0.8) # rad=0 for straight lines
    
    # Draw Nodes
    nx.draw_networkx_nodes(G, pos, node_size=3500, node_color=node_colors, 
                           edgecolors=node_edge_colors, linewidths=2, alpha=1.0)
    
    # Draw Labels (Activity Name + TE) - Inside the circle
    labels = {name: f"{name}\nTE={data['te']}" for name, data in node_data.items()}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=11, 
                           font_color=cfg['text_color'], font_weight='bold')
    
    # Add detailed stats (ES, EF, LS, LF) - Directly below the circle
    for name, data in node_data.items():
        x, y = pos[name]
        # Multi-line stats with clear separation
        stats_text = f"ES: {data['es']}   EF: {data['ef']}\nLS: {data['ls']}   LF: {data['lf']}"
        plt.text(x, y - 0.45, stats_text, fontsize=9, color=cfg['box_text'], 
                 ha='center', va='top', fontweight='bold',
                 bbox=dict(facecolor=cfg['box_bg'], alpha=0.8, edgecolor=cfg['box_border'], boxstyle='round,pad=0.3'))

    plt.title("PERT-CPM Sequence Flow Diagram", color=cfg['text_color'], pad=40, fontsize=18, fontweight='bold')
    
    # Adjust limits
    if pos:
        x_values = [p[0] for p in pos.values()]
        y_values = [p[1] for p in pos.values()]
        plt.xlim(min(x_values) - 1.0, max(x_values) + 1.0)
        plt.ylim(min(y_values) - 2.5, max(y_values) + 1.5)

    plt.axis('off')
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', transparent=True, dpi=140)
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    return img_str

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    try:
        data_json = request.json
        if isinstance(data_json, list):
            activities = data_json
            theme = 'dark-slate'
        else:
            activities = data_json.get('activities', [])
            theme = data_json.get('theme', 'dark-slate')

        results, cp, duration, G = calculate_cpm(activities)
        
        # Map node_data for graph gen convenience
        node_map = {r['name']: r for r in results}
        graph_b64 = generate_graph_base64(G, node_map, cp, theme)
        
        return jsonify({
            'success': True,
            'result': results,
            'critical_path': cp,
            'duration': duration,
            'graph': f"data:image/png;base64,{graph_b64}"
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/logo.png')
def serve_logo():
    return send_from_directory('templates', 'logo.png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
