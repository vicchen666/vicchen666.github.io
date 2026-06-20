{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

    $("#toolbar").on("click", ".tool-button", function() {
        c.selected_tool = $(this).data("tool");
        c.can_move_canvas = false;
        c.selected_element = { selected: [], hovered: -1, selected_axes: [], hovered_axis: -1 };
        c.can_select_elements = new Set();
        switch (c.selected_tool) {
            case "move":
                c.can_move_canvas = true;
                $("#main-canvas").css("cursor", "move");
                break;
            case "add-vertex":
                $("#main-canvas").css("cursor", "pointer");
                break;
            case "extend-beam":
                c.tool_status = "select_vertex";
                c.can_select_elements.add("vertex");
                $("#main-canvas").css("cursor", "pointer");
                break;
        }
        $(this).addClass("selected");
        $(this).siblings().removeClass("selected");
        c.render_frame();
    });
}