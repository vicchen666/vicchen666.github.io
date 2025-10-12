{
    $(".tab").on("click", function() {
        const index = $(this).index();
        $(this).css("border-width", "0"); 
        $(this).css("cursor", "default");
        switch (index) {
            case 0:
                $(this).siblings().css({"border-width": "0 0 1px 1px", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").removeClass("invisible");
                $("#main-sidebar > :nth-child(3)").addClass("invisible");
                break;
            case 1:
                $(this).siblings().css({"border-width": "0 1px 1px 0", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").addClass("invisible");
                $("#main-sidebar > :nth-child(3)").removeClass("invisible");
                break;
        }
    });

    $("#main-sidebar > :nth-child(2) > div").on("click", function() {
        const element = {id: c.element_id, name:`New ${$(this).text()}`, type: "lens", position: [Math.round((ctx.origin[0] + canvas.width / 2) / ctx.size), Math.round((ctx.origin[1] + canvas.height / 2) / ctx.size)], rotation: 90, unit_vector: [0, -1], focal_length: 200, size: 400, density: 10};
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
                element.size = "40";
                break;
            case 7:
                element.type = "parallel";
                break;
        }

        $("#main-sidebar > :nth-child(3)").append($("<div>").data("id", c.element_id++).text(`New ${$(this).text()}`));
        c.add_element($(this).data("type"), element);
        c.update_light_path();
    });

    $("#main-sidebar > :nth-child(3)").on("click", "> div", function() {
        if (+$(this).data("id") === c.selected_element.selected) {
            c.selected_element.selected = -1;
            $(this).css("color","");
            $("#element-settings").addClass("invisible");
        } else {
            c.selected_element.selected = +$(this).data("id");
            $(this).siblings().css("color","");
            $(this).css("color","limegreen");
            const index = c.optical_elements.findIndex(e => e.id === c.selected_element.selected);
            if (index !== -1) {
                reload_settings("optical_elements", index);
            } else {
                reload_settings("light_sources", c.light_sources.findIndex(e => e.id === c.selected_element.selected));
            }
        }
    }).on("mouseenter", "> div", function () {
        c.selected_element.hovered = +$(this).data("id");
    }).on("mouseleave", "> div", function() {
        c.selected_element.hovered = -1;
    });

    function reload_settings(type, index) {
        const optical_elements = ["Convex Lens", "Concave Lens", "Convex Mirror", "Concave Mirror", "Flat Mirror", "Barrier"];
        const light_sources = ["Point Source", "Parallel Source"];
        const settings = $("#element-settings").children("div");
        const element = c[type][index];
        $("#element-settings").removeClass("invisible");
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
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "focal_length").val(Math.abs(value)));
                        break;
                    case "size":
                        settings_grid.append($("<div>").text("Size"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "size").val(value));
                        break;
                    case "density":
                        settings_grid.append($("<div>").text("Density"));
                        settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "density").val(value));
                        break;
                }
            }
        }
        settings.append($("<button>").addClass("delete").attr("title", "Click to delete (or press Delete key)").text("Delete"));
    }

    $("#element-settings > div").on("change", "> select", function() {
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
        reload_settings(type, index);
        c.update_light_path();
    }).on("input", "#element-settings-grid > input", function() {
        const type = $(this).parent().siblings().first().data("type");
        const index = $(this).parent().siblings().first().data("index");
        switch($(this).data("setting")) {
            case "name":
                if($(this).val()) {
                    c[type][index].name = $(this).val();
                    $("#main-sidebar > :nth-child(3) > div").filter(function() {return $(this).data("id") === c[type][index].id}).text($(this).val());
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
        }
        c.update_light_path();
    }).on("click", "> button.delete", () => {
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
            $("#main-sidebar > :nth-child(3) > div").filter(function() {return $(this).data("id") === c.optical_elements[index].id}).remove();
            c.remove_element("optical_elements", index);
        } else {
            index = c.light_sources.findIndex(e => e.id === c.selected_element.selected);
            $("#main-sidebar > :nth-child(3) > div").filter(function() {return $(this).data("id") === c.light_sources[index].id}).remove();
            c.remove_element("light_sources", index);
        }
        c.selected_element.selected = -1;
        $("#element-settings").addClass("invisible");
        c.update_light_path();
    }
}