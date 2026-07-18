{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

    document.addEventListener("keydown", e => {
        const active = document.activeElement;
        if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
            return;
        }
        const key = e.key.toLowerCase();

        if ($("dialog[open]").length) {
            switch (key) {
                case "i":
                    $("#info-box")[0].close();
                    break;
            }
            return;
        };

        switch (key) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
                const $this = $(".toolbar-item").eq(Number(key) - 1).find(".tool-button");
                $this.addClass("selected");
                $this.parent().siblings(".toolbar-item").find(".tool-button").removeClass("selected");
                select_tool($this.data("tool"));
                break;
            case "i":
                $("#info-box")[0].showModal();
                break;
            case "delete":
            case "backspace":
            case "d":
                if (c.tool_status.tool !== "select") return;
                if (!c.selected_elements.selected.length) return;
                delete_element(c.selected_elements.selected[c.selected_elements.selected.length - 1]);
                break;
            case "c":
                if (!c.selected_elements.selected.length) return;
                center_element(c.selected_elements.selected[c.selected_elements.selected.length - 1]);
                break;
        }
    });

    $("#toolbar").on("click", ".tool-button", function() {
        $(this).addClass("selected");
        $(this).parent().siblings(".toolbar-item").find(".tool-button").removeClass("selected");
        $(this).siblings(".tool-submenu").addClass("invisible");
        select_tool($(this).data("tool"));
    }).on("mouseenter", ".tool-button", function() {
        $(this).parent().siblings().find(".tool-submenu").addClass("invisible");
        $(this).parent().find(".tool-submenu").removeClass("invisible");
    }).on("click", ".tool-submenu-button", function() {
        $(this).parent().addClass("invisible");
        const tool_button = $(this).parent().siblings(".tool-button");
        tool_button.addClass("selected");
        tool_button.parent().siblings().find(".tool-button").removeClass("selected");
        tool_button.data("tool", $(this).data("tool"));
        tool_button.children(".tool-icon").attr("src", $(this).children(".tool-icon").attr("src"));
        select_tool($(this).data("tool"));
    });

    function select_tool(tool) {
        c.tool_status.tool = tool;
        c.can_move_canvas = false;
        c.default_cursor = "default";
        c.preview_elements.beams.forEach(beam => beam.destroy());
        c.preview_elements = { vertices: [], beams: [], axes: [] };
        if (c.selected_elements.hovered in c.vertices) {
            c.vertices[c.selected_elements.hovered].show = true;
        } else if (c.selected_elements.hovered in c.beams) {
            c.beams[c.selected_elements.hovered].show = true;
            c.beams[c.selected_elements.hovered].assign_vertices();
        }
        c.selected_elements.selected.forEach(id => {
            if (id in c.vertices) {
                c.vertices[id].show = true;
            } else if (id in c.beams) {
                c.beams[id].show = true;
                c.beams[id].assign_vertices();
            }
        });
        c.selected_elements = { selected: [], hovered: -1 };
        $("#element-settings").addClass("invisible");
        move_general_settings_icon("invisible");

        const buttons = $("#element-list > div > button");
        buttons.addClass("default-cursor");

        switch (c.tool_status.tool) {
            case "move":
                c.can_move_canvas = true;
                c.default_cursor = "move";
                buttons.removeClass("default-cursor");
                break;
            case "select":
                c.tool_status.status = "select_element";
                buttons.removeClass("default-cursor");
                break;
            case "add-vertex-click":
                c.tool_status.status = "add_vertex";
                break;
            case "extend-beam-vertex":
            case "extend-beam-length":
            case "connect-vertices":
            case "connect-vertex-along-axes":
            case "connect-vertex-beam":
            case "delete-vertex":
            case "dissolve-vertex":
                c.tool_status.status = "select_vertex";
                break;
            case "add-vertex-beam":
            case "add-beam-intersection":
            case "delete-beam":
                c.tool_status.status = "select_beam";
                break;
        }
        c.render_frame();
    }

    $("#element-list").on("click", "> div > button", function() {
        if (c.tool_status.tool === "select") {
            if (c.selected_elements.selected.includes(String($(this).data("id")))) {
                c.selected_elements.selected = [];
                c.selected_elements.hovered = String($(this).data("id"));
                $("#element-settings").addClass("invisible");
                move_general_settings_icon("invisible");
            } else {
                c.selected_elements.selected = [String($(this).data("id"))];
                c.selected_elements.hovered = -1;
                reload_element_settings(c.selected_elements.selected[0]);
            }
            c.render_frame();
        }
    }).on("mouseenter", "> div > button", function() {
        if (c.selected_elements.selected.includes(String($(this).data("id")))) return;
        c.selected_elements.hovered = String($(this).data("id"));
        c.render_frame();
    }).on("mouseleave", "> div > button", function() {
        if (c.selected_elements.selected.includes(String($(this).data("id")))) return;
        c.selected_elements.hovered = -1;
        c.render_frame();
    });

    function move_general_settings_icon(state) {
        if (state === "visible") {
            $("#general-settings-frame").css("right", $("#element-settings").outerWidth() + 10);
        } else {
            $("#general-settings-frame").css("right", 10);
        }
    }

    function reload_element_settings(id) {
        let element, type;
        if (id in c.vertices) {
            element = c.vertices[id];
            type = "vertex";
        } else if (id in c.beams) {
            element = c.beams[id];
            type = "beam";
        }
        const settings = $("#element-settings");
        settings.text("");
        settings.append($("<div>").data("id", id).attr("id", "element-settings-title").text(type.slice(0, 1).toUpperCase() + type.slice(1) + " Parameters"));
        const settings_grid = $("<div>").attr("id", "element-settings-grid").appendTo(settings);
        settings_grid.append($("<div>").text("Name"));
        settings_grid.append($("<input>").attr("type", "text").data("setting", "name").val(element.name));

        if (type === "vertex") {
            settings_grid.append($("<div>").text("X"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.position[0]));
            settings_grid.append($("<div>").text("Y"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.position[1]));
            settings_grid.append($("<div>").text("Axis 1 Positive"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["1"]?.name ?? "None"));
            settings_grid.append($("<div>").text("Axis 2 Positive"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["2"]?.name ?? "None"));
            settings_grid.append($("<div>").text("Axis 3 Positive"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["3"]?.name ?? "None"));
            settings_grid.append($("<div>").text("Axis 1 Negative"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["-1"]?.name ?? "None"));
            settings_grid.append($("<div>").text("Axis 2 Negative"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["-2"]?.name ?? "None"));
            settings_grid.append($("<div>").text("Axis 3 Negative"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.beams["-3"]?.name ?? "None"));
        } else if (type === "beam") {
            settings_grid.append($("<div>").text("Start Vertex"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.vertices[0].name));
            settings_grid.append($("<div>").text("End Vertex"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.vertices[1].name));
            settings_grid.append($("<div>").text("Axis"));
            settings_grid.append($("<input>").attr("readonly", true).val(element.direction));
        }

        settings.append($("<div>").css("display", "flex")
        .append($("<button>").attr({"id": "element-center", "class": "text-button", "title": "Center the element"}).text("Center"))
        .append($("<button>").attr({"id": "element-delete", "class": "text-button", "title": "Delete the element"}).text("Delete")));

        $("#element-settings").removeClass("invisible");
        move_general_settings_icon("visible");
    }

    $("#element-settings").on("input", "#element-settings-grid > input", function() {
        const id = $("#element-settings-title").data("id");
        let element, type;
        if (id in c.vertices) {
            element = c.vertices[id];
            type = "vertex";
        } else if (id in c.beams) {
            element = c.beams[id];
            type = "beam";
        }

        switch($(this).data("setting")) {
            case "name":
                if($(this).val()) {
                    element.name = $(this).val();
                    $("#element-list > div > button").filter(function() {return $(this).data("id") === element.id}).text($(this).val());
                }
                break;
        }

        c.render_frame();
    }).on("click", "#element-center", function() {
        center_element($("#element-settings-title").data("id"));
    }).on("click", "#element-delete", () => {
        delete_element($("#element-settings-title").data("id"));
    });

    function center_element(id) {
        if (id in c.vertices) {
            const element = c.vertices[id];
            c.origin = [element.position[0] * c.size - canvas.width / 2, element.position[1] * c.size + canvas.height / 2];
        } else if (id in c.beams) {
            const element = c.beams[id];
            const midpoint = vec_scale(vec_add(element.vertices[0].position, element.vertices[1].position), 0.5);
            c.origin = [midpoint[0] * c.size - canvas.width / 2, midpoint[1] * c.size + canvas.height / 2];
        }
        c.set_canvas();
    }

    function delete_element(id) {
        if (id in c.vertices) {
            Object.values(c.vertices[id].beams).forEach(beam => {
                c.remove_element(c.beams[beam.id]);
            });
            c.remove_element(c.vertices[id]);
        } else if (id in c.beams) {
            c.remove_element(c.beams[id]);
        }

        c.selected_elements.selected = [];
        $("#element-settings").addClass("invisible");
        move_general_settings_icon("invisible");
        c.render_frame();
    }

    $("#general-settings-icon").on("click", function() {
        $("#general-settings").toggleClass("invisible");
    });

    function normalize_hex_color(value) {
        const hex = String(value).replace("#", "").toLowerCase();
        if (hex.length === 3) {
            return hex.split("").map(char => char + char).join("");
        }
        return hex.slice(0, 6);
    }

    function build_style_with_alpha(color, alpha) {
        const normalized_color = normalize_hex_color(color);
        const clamped_alpha = Math.max(0, Math.min(1, +alpha));
        const alpha_hex = Math.round(clamped_alpha * 255).toString(16).padStart(2, "0");
        return `#${normalized_color}${alpha_hex}`;
    }

    function parse_style_with_alpha(style) {
        const hex = String(style || "").replace("#", "").toLowerCase();
        if (hex.length === 8) {
            return {
                color: `#${hex.slice(0, 6)}`,
                alpha: parseInt(hex.slice(6), 16) / 255,
            };
        }
        return {
            color: `#${normalize_hex_color(hex)}`,
            alpha: 1,
        };
    }

    $(".general-settings-section-grid > input").on("change", function() {
        if ($(this).parent().data("setting_type") === "rendering_styles") {
            switch ($(this).data("setting")) {
                case "background_color":
                    canvas.style.backgroundColor = $(this).val();
                    break;
                case "vertex_fill_color_1":
                    c.settings.vertex_fill_styles[0] = $(this).val();
                    break;
                case "vertex_fill_color_2":
                    c.settings.vertex_fill_styles[1] = $(this).val();
                    break;
                case "vertex_fill_color_3":
                    c.settings.vertex_fill_styles[2] = $(this).val();
                    break;
                case "beam_fill_color_1":
                    c.settings.beam_fill_styles[0] = $(this).val();
                    break;
                case "beam_fill_color_2":
                    c.settings.beam_fill_styles[1] = $(this).val();
                    break;
                case "beam_fill_color_3":
                    c.settings.beam_fill_styles[2] = $(this).val();
                    break;
                case "hover_color": {
                    c.settings.hovered_style = build_style_with_alpha($(this).val(), parse_style_with_alpha(c.settings.hovered_style).alpha);
                    break;
                }
                case "hover_alpha": {
                    if ($(this).val() < 0) {
                        $(this).val(0);
                    } else if ($(this).val() > 1) {
                        $(this).val(1);
                    }
                    c.settings.hovered_style = build_style_with_alpha(parse_style_with_alpha(c.settings.hovered_style).color, $(this).val());
                    break;
                }
                case "select_color":
                    c.settings.selected_style = build_style_with_alpha($(this).val(), parse_style_with_alpha(c.settings.selected_style).alpha);
                    break;
                case "select_alpha":
                    if ($(this).val() < 0) {
                        $(this).val(0);
                    } else if ($(this).val() > 1) {
                        $(this).val(1);
                    }
                    c.settings.selected_style = build_style_with_alpha(parse_style_with_alpha(c.settings.selected_style).color, $(this).val());
                    break;
                case "axis_arrow_color":
                    c.settings.axis_style = $(this).val();
                    break;
                case "preview_alpha":
                    if ($(this).val() < 0) {
                        $(this).val(0);
                    } else if ($(this).val() > 1) {
                        $(this).val(1);
                    }
                    c.settings.preview_alpha = +$(this).val();
                    break;
            }
            c.sync_settings();
            c.render_frame();
        }
    });

    $("#button-info").on("click", function() {
        $("#info-box")[0].showModal();
    });

    $("#info-box-close").on("click", function() {
        $("#info-box")[0].close();
    });
}