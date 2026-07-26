import $ from "jquery";
import * as utils from "utils";

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

    utils.message("success", "Project downloaded!");
}

export function open_project(c, data) {
    try {
        switch (data.version) {
            case 1: {
                const rendering_styles = data.general_settings.rendering_styles;
                $("#main-canvas > canvas").css("background-color", rendering_styles.background_color);
                c.settings.fill_styles = rendering_styles.fill_styles;
                c.settings.hovered_style = rendering_styles.hovered_style;
                c.settings.selected_style = rendering_styles.selected_style;
                c.settings.axis_style = rendering_styles.axis_style;
                c.settings.preview_alpha = rendering_styles.preview_alpha;
                utils.reload_general_settings(c);

                
            }
            default:
                throw new Error("No version data");
        }
    } catch (err) {
        console.error(err);
        utils.message("fail", "Failed to open project! Invalid JSON structure.");
    }
}
