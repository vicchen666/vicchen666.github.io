import $ from "jquery";
import CanvasControl from "canvas_control";
import * as utils from "utils";

export function download_project(c) {
    const data = {
        version: 2,
        general_settings: {
            ray_settings: {
                max_ray_length: c.max_distance,
                solid_length: c.fill_length,
                gap_length: c.sep_length
            }
        },
        elements: {
            optical_elements: [],
            light_sources: []
        },
        misc: {
            canvas: {
                origin: c.origin,
                scale: c.size
            }
        }
    };

    c.optical_elements.forEach(e => {
        const index = data.elements.optical_elements.push({}) - 1;
        for(const [key, value] of Object.entries(e)) {
            data.elements.optical_elements[index][key] = value;
        }
    });
    c.light_sources.forEach(e => {
        const index = data.elements.light_sources.push({}) - 1;
        for(const [key, value] of Object.entries(e)) {
            data.elements.light_sources[index][key] = value;
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Lenses and Mirrors.json';
    a.click();
    a.href = "";
    URL.revokeObjectURL(url);

    utils.message("success", "Project downloaded!");
}

export function open_project() {
    return new Promise(resolve => {
        const input = document.getElementById("input-open");
        if (!input) {
            resolve(null);
            return;
        }

        const handle_change = function(event) {
            const file = event.target.files[0];
            input.removeEventListener("change", handle_change);
            input.value = "";

            if (!file) {
                resolve(null);
                return;
            }

            read_project(file).then(resolve);
        };

        input.addEventListener("change", handle_change);
        input.click();
    });
}

function read_project(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                const new_c = load_project(data);
                resolve(new_c);
            } catch (err) {
                console.error(err);
                utils.message("fail", "Failed to open project! Invalid JSON file.");
                resolve(null);
            }
        };
        reader.onerror = function() {
            utils.message("fail", "Failed to read the selected file.");
            resolve(null);
        };
        reader.readAsText(file);
    });
}

function load_project(data) {
    let c = new CanvasControl($("#main-canvas > canvas")[0]);
    try {
        switch (data.version) {
            case 1:
            case 2: {
                const ray_settings = data.general_settings.ray_settings;
                c.max_distance = ray_settings.max_ray_length;
                c.fill_length = ray_settings.solid_length;
                c.sep_length= ray_settings.gap_length;
                utils.reload_general_settings(c);

                c.size = data.misc.canvas.scale;
                c.origin = data.version === 1
                    ? data.misc.canvas.origin.map(value => value / c.size)
                    : data.misc.canvas.origin;

                utils.toggle_element_settings(c, false);
                $("#element-list").text("");

                let id = 0;
                data.elements.optical_elements.forEach(e => {
                    c.add_element("optical_elements", e);
                    c.optical_elements[c.optical_elements.length - 1].id = id;
                    $("#element-list").append($("<li>").addClass("element-list-item").append($("<button>").data("id", id++).text(e.name)));
                });
                data.elements.light_sources.forEach(e => {
                    c.add_element("light_sources", e);
                    c.light_sources[c.light_sources.length - 1].id = id;
                    $("#element-list").append($("<li>").addClass("element-list-item").append($("<button>").data("id", id++).text(e.name)));
                });
                c.next_id = id;

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
