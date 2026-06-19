{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

    let selected_tool = "move-canvas";

    $("#toolbar").on("click", ".tool-button", function() {
        selected_tool = $(this).data("tool");
        $(this).addClass("selected");
        $(this).siblings().removeClass("selected");
    });

    $("#main-canvas").on("mousedown", function(e) {
        switch (selected_tool) {
            case "move":
                // c.move_canvas(e.offsetX, e.offsetY);
                break;
            case "add-vertex":
                c.add_vertex(e.clientX, e.clientY);
                break;
            case "extend-beam":
                c.extend_beam(e.offsetX, e.offsetY);
                break;
        }
    });
}