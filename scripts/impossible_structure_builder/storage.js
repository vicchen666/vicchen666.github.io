import $ from "jquery";
import { message } from "./utils.js";

export function download_project(c) {
    const id_map = new Map(
        [...c.render_order]
            .sort((a, b) => a - b)
            .map((id, index) => [id, index])
    );

    const data = {
        version: 1,
        general_settings: {
            rendering_styles: {
                background_color: $("#main-canvas > canvas").css("background-color"),
                fill_styles: c.settings.fill_styles,
                hovered_style: c.settings.hovered_style,
                selected_style: c.settings.selected_style,
                axis_style: c.settings.axis_style,
                preview_alpha: c.settings.preview_alpha,
            }
        },
        elements: {
            vertices: [],
            beams: [],
            render_order: [],
            next_name: c.next_name,
        },
        canvas: {
            origin: c.origin,
            scale: c.size
        },
        misc: {
            axes: c.axes,
        }
    };

    c.render_order.forEach(id => {
        if (c.vertices.has(id)) {
            const vertex = c.vertices.get(id);
            data.elements.vertices.push([
                id_map.get(vertex.id),
                {
                    name: vertex.name,
                    position: vertex.position
                }
            ]);
        } else if (c.beams.has(id)) {
            const beam = c.beams.get(id);
            data.elements.beams.push([
                id_map.get(beam.id),
                {
                    name: beam.name,
                    vertices: [id_map.get(beam.vertices[0].id), id_map.get(beam.vertices[1].id)],
                    direction: beam.direction
                }
            ]);
        }
    });
    data.elements.render_order = c.render_order.map(id => id_map.get(id));


    const blob = new Blob([JSON.stringify(data, null, 2)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Impossible Structure Builder.json';
    a.click();
    a.href = "";
    URL.revokeObjectURL(url);

    message("success", "Project downloaded!");
}

export function open_project(c, data) {
}
