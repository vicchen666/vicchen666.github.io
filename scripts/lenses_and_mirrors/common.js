{
    window.addEventListener("beforeunload", e => {
        e.preventDefault();
        e.returnValue = "";
        return "";
    });
    
    $(".tab").on("click", function() {
        const index = $(this).index();
        $(this).css("border-width", "0"); 
        $(this).css("cursor", "default");
        $(this).removeClass("clickable");
        switch (index) {
            case 0:
                $(this).siblings().css({"border-width": "0 0 1px 1px", "cursor": "pointer"}).addClass("clickable");
                $("#element-add").removeClass("invisible");
                $("#element-list").addClass("invisible");
                break;
            case 1:
                $(this).siblings().css({"border-width": "0 1px 1px 0", "cursor": "pointer"}).addClass("clickable");
                $("#element-add").addClass("invisible");
                $("#element-list").removeClass("invisible");
                break;
        }
    });

    $("#element-add > div").on("click", function() {
        const element = {id: c.element_id, name:`New ${$(this).text()}`, type: "lens", position: [Math.round((ctx.origin[0] + canvas.width / 2) / ctx.size), Math.round((ctx.origin[1] + canvas.height / 2) / ctx.size)], size: 400, rotation: 90, unit_vector: [0, -1], angle: 90, focal_length: 200, density: 10};
        switch($(this).index()) {
            case 1:
                element.focal_length = -200;
                break;
            case 2:
                element.type = "mirror";
                element.focal_length = -200;
                break;
            case 3:
                element.type = "mirror";
                break;
            case 4:
                element.type = "flat_mirror";
                break;
            case 5:
                element.type = "barrier";
                break;
            case 6:
                element.type = "point";
                break;
            case 7:
                element.type = "parallel";
                break;
        }

        $("#element-list").append($("<div>").data("id", c.element_id++).text(`New ${$(this).text()}`));
        c.add_element($(this).data("type"), element);
        c.update_light_path();
    });

    $("#element-list").on("click", "> div", function() {
        if (+$(this).data("id") === c.selected_element.selected) {
            c.selected_element.selected = -1;
            $(this).css("color","");
            $("#element-settings").addClass("invisible");
            move_general_settings_icon("invisible");
        } else {
            c.selected_element.selected = +$(this).data("id");
            $(this).siblings().css("color","");
            $(this).css("color","limegreen");
            const index = c.optical_elements.findIndex(e => e.id === c.selected_element.selected);
            if (index !== -1) {
                reload_element_settings("optical_elements", index);
            } else {
                reload_element_settings("light_sources", c.light_sources.findIndex(e => e.id === c.selected_element.selected));
            }
        }
    }).on("mouseenter", "> div", function () {
        c.selected_element.hovered = +$(this).data("id");
    }).on("mouseleave", "> div", function() {
        c.selected_element.hovered = -1;
    });

    function reload_element_settings(type, index) {
        const optical_elements = ["Convex Lens", "Concave Lens", "Convex Mirror", "Concave Mirror", "Flat Mirror", "Barrier"];
        const light_sources = ["Point Source", "Parallel Source"];
        const settings = $("#element-settings");
        const element = c[type][index];
        settings.text("");
        if (type === "optical_elements") {
            settings.append($("<div>").data({"type": type, "index": index}).css("font-size", "40px").text("Optical Element"));
            settings.append($("<select>"));
            optical_elements.forEach(e => {
                settings.children("select").append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
            });
        } else {
            settings.append($("<div>").data({"type": type, "index": index}).css("font-size", "40px").text("Light Source"));
            settings.append($("<select>"));
            light_sources.forEach(e => {
                settings.children("select").append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
            });
        }
        switch (element.type) {
            case "lens":
                settings.children("select").val(element.focal_length > 0 ? "convex_lens" : "concave_lens");
                break;
            case "mirror":
                settings.children("select").val(element.focal_length > 0 ? "concave_mirror" : "convex_mirror");
                break;
            case "point":
            case "parallel":
                settings.children("select").val(`${element.type}_source`);
                break;
            default:
                settings.children("select").val(element.type);
        }

        const settings_grid = $("<div>").attr("id", "element-settings-grid").appendTo(settings);
        for (const [key, value] of Object.entries(element)) {
            if (c.elements_settings[element.type].includes(key)) {
                switch (key) {
                    case "name":
                        settings_grid.append($("<div>").text("Name"));
                        settings_grid.append($("<input>").attr("type", "text").data("setting", "name").val(value));
                        break;
                    case "position":
                        settings_grid.append($("<div>").text("X"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "x").val(value[0]));
                        settings_grid.append($("<div>").text("Y"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "y").val(-value[1]));
                        break;
                    case "rotation":
                        settings_grid.append($("<div>").text("Rotation (deg)"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "rotation").val(value));
                        break;
                    case "focal_length":
                        settings_grid.append($("<div>").text("Focal Length"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "focal_length").val(Math.abs(value)));
                        break;
                    case "size":
                        settings_grid.append($("<div>").text("Size"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "size").val(value));
                        break;
                    case "density":
                        settings_grid.append($("<div>").text("Density"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "density").val(value));
                        break;
                    case "angle":
                        settings_grid.append($("<div>").text("Angle (deg)"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0, "max": 360}).data("setting", "angle").val(value));
                        break;
                }
            }
        }
        settings.append($("<div>").css("display", "flex")
        .append($("<button>").attr({"id": "element-center", "title": "Click to center the element"}).text("Center"))
        .append($("<button>").attr({"id": "element-delete", "title": "Click to delete (or press Delete key)"}).text("Delete")));
        $("#element-settings").removeClass("invisible");
        move_general_settings_icon("visible");
    }

    $("#element-settings").on("change", "> select", function() {
        const type = $(this).siblings().first().data("type");
        const index = $(this).siblings().first().data("index");
        switch($(this).val()) {
            case "concave_lens":
                c[type][index].focal_length = -Math.abs(c[type][index].focal_length);
                c[type][index].type = "lens";
                break;
            case "convex_lens":
                c[type][index].focal_length = Math.abs(c[type][index].focal_length);
                c[type][index].type = "lens";
                break;
            case "concave_mirror":
                c[type][index].focal_length = Math.abs(c[type][index].focal_length);
                c[type][index].type = "mirror";
                break;
            case "convex_mirror":
                c[type][index].focal_length = -Math.abs(c[type][index].focal_length);
                c[type][index].type = "mirror";
                break;
            case "flat_mirror":
                c[type][index].type = "flat_mirror";
                break;
            case "barrier":
                c[type][index].type = "barrier";
                break;
            case "point_source":
                c[type][index].type = "point";
                break;
            case "parallel_source":
                c[type][index].type = "parallel";
                break;
        }
        reload_element_settings(type, index);
        c.update_light_path();
    }).on("input", "#element-settings-grid > input", function() {
        const type = $(this).parent().siblings().first().data("type");
        const index = $(this).parent().siblings().first().data("index");
        switch($(this).data("setting")) {
            case "name":
                if($(this).val()) {
                    c[type][index].name = $(this).val();
                    $("#element-list > div").filter(function() {return $(this).data("id") === c[type][index].id}).text($(this).val());
                }
                break;
            case "x":
                c[type][index].position[0] = +$(this).val();
                break;
            case "y":
                c[type][index].position[1] = -$(this).val();
                break;
            case "rotation":
                c[type][index].rotation = $(this).val();
                c[type][index].unit_vector = [Math.cos(+$(this).val() / 360 * TAU), Math.sin(-$(this).val() / 360 * TAU)];
                break;
            case "focal_length":
                if ($(this).val() > 0) {
                    if ($(this).parent().siblings().eq(1).val() === "concave_lens" || $(this).parent().siblings().eq(1).val() === "convex_mirror") {
                        c[type][index].focal_length = -$(this).val();
                    } else {
                        c[type][index].focal_length = +$(this).val();
                    }
                }
                break;
            case "size":
                if ($(this).val() > 0) {
                    c[type][index].size = +$(this).val();
                }
                break;
            case "density":
                if ($(this).val() > 0) {
                    c[type][index].density = +$(this).val();
                }
                break;
            case "angle":
                if ($(this).val() >= 0 && $(this).val() <= 360) {
                    c[type][index].angle = $(this).val();
                }
                break;
        }
        c.update_light_path();
    }).on("click", "#element-center", function() {
        const type = $(this).parent().siblings().first().data("type");
        const index = $(this).parent().siblings().first().data("index");
        ctx.origin = [c[type][index].position[0] * ctx.size - canvas.width / 2, c[type][index].position[1] * ctx.size - canvas.height / 2];
        c.set_canvas();
    }).on("click", "#element-delete", () => {
        delete_element();
    });

    document.addEventListener("keydown", e => {
        const active = document.activeElement;
        if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
            return;
        }
        if (e.key === "Delete") {
            delete_element();
        }
    });

    function delete_element() {
        if (c.selected_element.selected === -1) return;
        let index = c.optical_elements.findIndex(e => e.id === c.selected_element.selected);
        if (index !== -1) {
            $("#element-list > div").filter(function() {return $(this).data("id") === c.optical_elements[index].id}).remove();
            c.remove_element("optical_elements", index);
        } else {
            index = c.light_sources.findIndex(e => e.id === c.selected_element.selected);
            $("#element-list > div").filter(function() {return $(this).data("id") === c.light_sources[index].id}).remove();
            c.remove_element("light_sources", index);
        }
        c.selected_element.selected = -1;
        $("#element-settings").addClass("invisible");
        move_general_settings_icon("invisible");
        c.update_light_path();
    }

    $("#general-settings-icon").on("click", function() {
        $("#general-settings").toggleClass("invisible");
    });

    function move_general_settings_icon(state) {
        if (state === "visible") {
            $("#general-settings-frame").css("right", $("#element-settings").outerWidth() + 10);
        } else {
            $("#general-settings-frame").css("right", 10);
        }
    }

    $(".general-settings-grid > input").on("change", function() {
        if ($(this).parent().data("setting_type") === "ray_rendering") {
            if (+$(this).val() < 0) {
                $(this).val(c[$(this).data("setting")]);
                return;
            }
            if ($(this).data("setting") === "fill_length" && +$(this).val() === 0 && +$(this).val() + c.sep_length === 0) {
                $(this).val(c[$(this).data("setting")]);
                return;
            }
            if ($(this).data("setting") === "sep_length" && +$(this).val() === 0 && +$(this).val() + c.fill_length === 0) {
                $(this).val(c[$(this).data("setting")]);
                return;
            }
            c[$(this).data("setting")] = +$(this).val();
            c.update_light_path();
        }
    });
    
    $("#button-download").on("click", () => {
        const data = {
            version: 1,
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
                    origin: ctx.origin,
                    scale: ctx.size
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
    });

    $("#button-upload").on("click", () => {
        $("#input-upload").click();
    });
    $("#input-upload").on("change", function(event) {
        const file = event.target.files[0];
        if (!file) return;
        $(this).val("");

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                upload_project(data);
            } catch (err) {
                console.log(err);
                message("fail", "File upload failed! Invalid JSON file.");
            }
        }
        reader.readAsText(file);
    });

    function upload_project(data) {
        try {
            if (data.version === 1) {
                const ray_settings = data.general_settings.ray_settings;
                c.max_distance = ray_settings.max_ray_length;
                c.fill_length = ray_settings.solid_length;
                c.sep_length= ray_settings.gap_length;
                reload_general_settings();
                ctx.origin = data.misc.canvas.origin;
                ctx.size = data.misc.canvas.scale;

                $("#element-settings").addClass("invisible");
                move_general_settings_icon("invisible");
                $("#element-list").text("");
                c.selected_element = [-1, -1];
                c.light_sources = [];
                c.optical_elements = [];
                let id = 0;
                data.elements.optical_elements.forEach(e => {
                    c.add_element("optical_elements", e);
                    c.optical_elements[c.optical_elements.length - 1].id = id;
                    $("#element-list").append($("<div>").data("id", id++).text(e.name));
                });
                data.elements.light_sources.forEach(e => {
                    c.add_element("light_sources", e);
                    c.light_sources[c.light_sources.length - 1].id = id;
                    $("#element-list").append($("<div>").data("id", id++).text(e.name));
                });
                c.element_id = id;
                c.set_canvas();
                c.update_light_path();
                message("success", "File uploaded successfully!")
            } else {
                throw new Error("No version data");
            }
        } catch (err) {
            console.log(err);
            message("fail", "File upload failed! Invalid JSON structure.");
        }
    }

    function reload_general_settings() {
        $("#general-settings input").each(function() {
            $(this).val(c[$(this).data("setting")]);
        });
    }

    function message(type, text) {
        switch (type) {
            case "success":
                $("#message-box").css("background-color", "limegreen");
                break;
            case "fail":
                $("#message-box").css("background-color", "crimson");
                break;
        }
        $("#message-box").text(text).fadeIn(500).delay(3000).fadeOut(1000);
    }
}