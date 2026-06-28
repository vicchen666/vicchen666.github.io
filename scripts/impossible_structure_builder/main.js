{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

    $("#toolbar").on("click", ".tool-button", function() {
        $(this).addClass("selected");
        $(this).parent().siblings().find(".tool-button").removeClass("selected");
        $(this).siblings(".tool-submenu").addClass("invisible");
        c.tool_status.tool = $(this).data("tool");
        select_tool();
    });

    $("#toolbar").on("mouseenter", ".tool-button", function() {
        $(this).parent().siblings().find(".tool-submenu").addClass("invisible");
        $(this).parent().find(".tool-submenu").removeClass("invisible");
    });

    $("#toolbar").on("click", ".tool-submenu-button", function() {
        $(this).parent().addClass("invisible");
        const tool_button = $(this).parent().siblings(".tool-button");
        tool_button.addClass("selected");
        tool_button.parent().siblings().find(".tool-button").removeClass("selected");
        tool_button.data("tool", $(this).data("tool"));
        tool_button.children(".tool-icon").attr("src", $(this).children(".tool-icon").attr("src"));
        c.tool_status.tool = $(this).data("tool");
        select_tool();
    });

    function select_tool() {
        c.can_move_canvas = false;
        c.selected_elements = { selected: [], hovered: -1 };
        c.tool_status.status = "idle";
        c.tool_status.can_select_elements = new Set([]);
        c.tool_status.create_element = null;
        c.preview_elements.beams.forEach(beam => beam.destroy());
        c.preview_elements = { vertices: [], beams: [], axes: [] };
        switch (c.tool_status.tool) {
            case "move":
                c.can_move_canvas = true;
                c.tool_status.can_select_elements.add("vertex").add("beam");
                $("#main-canvas").css("cursor", "move");
                break;
            case "add-vertex-click":
                c.tool_status.create_element = "vertex";
                $("#main-canvas").css("cursor", "pointer");
                break;
            case "extend-beam-vertex":
                c.tool_status.status = "select_vertex";
                c.tool_status.can_select_elements.add("vertex");
                $("#main-canvas").css("cursor", "pointer");
                break;
            case "extend-beam-length":
                c.tool_status.status = "select_vertex";
                c.tool_status.can_select_elements.add("vertex");
                $("#main-canvas").css("cursor", "pointer");
                break;
            case "connect-vertex-along-axes":
                c.tool_status.status = "select_vertex";
                c.tool_status.can_select_elements.add("vertex");
                $("#main-canvas").css("cursor", "pointer");
                break;
        }
        c.render_frame();
    }
}