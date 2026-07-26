import $ from "jquery";
import CanvasControl from "canvas_control";
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

export function open_project(data) {
    let c = new CanvasControl($("#main-canvas > canvas")[0]);
    try {
        switch (data.version) {
            case 1: {
                c.set_axes(data.misc.axes);

                const rendering_styles = data.general_settings.rendering_styles;
                $("#main-canvas > canvas").css("background-color", rendering_styles.background_color);
                c.settings.fill_styles = rendering_styles.fill_styles;
                c.settings.hovered_style = rendering_styles.hovered_style;
                c.settings.selected_style = rendering_styles.selected_style;
                c.settings.axis_style = rendering_styles.axis_style;
                c.settings.preview_alpha = rendering_styles.preview_alpha;
                utils.reload_general_settings(c);

                c.origin = data.canvas.origin;
                c.size = data.canvas.scale;

                utils.toggle_element_settings(c, false);
                $("#element-list").text("");

                c.render_order = data.elements.render_order;
                data.elements.vertices.forEach(([id, vertex_data]) => {
                    const vertex = c.create_vertex(vertex_data.position, { id, name: vertex_data.name });
                    c.vertices.set(vertex.id, vertex);
                });
                data.elements.beams.forEach(([id, beam_data]) => {
                    const beam = c.create_beam([c.vertices.get(beam_data.vertices[0]), c.vertices.get(beam_data.vertices[1])], beam_data.direction, { id, name: beam_data.name });
                    c.beams.set(beam.id, beam);
                });
                c.render_order.forEach(id => {
                    if (c.vertices.has(id)) {
                        register_element(c, c.vertices.get(id));
                    } else if (c.beams.has(id)) {
                        register_element(c, c.beams.get(id));
                    }
                });
                c.update_element_order();
                c.next_id = Math.max(-1, ...c.render_order) + 1;
                c.next_name = data.elements.next_name;

                utils.message("success", "Project opened successfully!");
                return c;
            }
            default:
                throw new Error("No version data");
        }
    } catch (err) {
        console.error(err);
        utils.message("fail", "Failed to open project! Invalid JSON structure.");
        c.destroy();
        c = null;
        return null;
    }
}

function register_element(c, element) {
    const order = $("<div>").text(c.render_order.indexOf(element.id) + 1);
    const button = $("<button>").data("id", element.id).text(element.name);
    $("#element-list").append($("<li>").addClass("element-list-item").append(order).append(button));
}