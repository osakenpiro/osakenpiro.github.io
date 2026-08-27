import math
import os
import bpy
from mathutils import Vector

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSET_ID = "OPEN-FIELD-SCENERY-01"

TRACK_SEGS = [
    (-270, -230, -30, -278),
    (-30, -278, 235, -222),
    (235, -222, 315, -20),
    (315, -20, 228, 220),
    (228, 220, -48, 286),
    (-48, 286, -286, 198),
    (-286, 198, -342, -15),
    (-342, -15, -270, -230),
]
RIVER_PATH = [(-380, 128), (-270, 104), (-145, 126), (-20, 96), (110, 118), (245, 88), (390, 104)]

MAT = {}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def make_mat(name, color, metallic=0.0, roughness=0.7, emission=None):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.8
    return material


def setup_materials():
    MAT["water"] = make_mat("scenery_water", (0.06, 0.34, 0.42), 0.05, 0.22)
    MAT["water_light"] = make_mat("scenery_water_light", (0.18, 0.64, 0.62), 0.0, 0.28)
    MAT["wood"] = make_mat("scenery_bridge_wood", (0.42, 0.22, 0.09), 0.05, 0.66)
    MAT["wood_light"] = make_mat("scenery_bridge_edge", (0.70, 0.42, 0.16), 0.1, 0.48)
    MAT["charcoal"] = make_mat("scenery_charcoal", (0.035, 0.055, 0.065), 0.22, 0.36)
    MAT["cream"] = make_mat("scenery_cream", (0.78, 0.58, 0.30), 0.04, 0.52)
    MAT["coral"] = make_mat("scenery_coral", (0.78, 0.18, 0.06), 0.02, 0.5)
    MAT["gold"] = make_mat("scenery_signal_gold", (0.76, 0.38, 0.06), 0.5, 0.28)
    MAT["mint"] = make_mat("scenery_beacon_mint", (0.08, 0.72, 0.55), 0.0, 0.2, (0.08, 0.72, 0.55))
    MAT["hill"] = make_mat("scenery_hill", (0.19, 0.28, 0.30), 0.0, 0.92)
    MAT["hill_light"] = make_mat("scenery_hill_light", (0.28, 0.42, 0.39), 0.0, 0.88)
    MAT["glass"] = make_mat("scenery_glass", (0.02, 0.12, 0.15), 0.2, 0.18)


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def game_to_blender(location):
    """Map game (x, vertical-y, world-z) to Blender (x, y, z-up)."""
    x, y, z = location
    return (x, -z, y)


def game_dimensions_to_blender(dimensions):
    x, y, z = dimensions
    return (x, z, y)


def add_box(name, location, dimensions, material, rotation=0.0, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(
        location=game_to_blender(location),
        rotation=(0.0, 0.0, -rotation),
    )
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = game_dimensions_to_blender(dimensions)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, material)
    if bevel:
        mod = obj.modifiers.new("soft_edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return obj


def add_cylinder(name, location, radius, depth, material, vertices=12, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=game_to_blender(location),
        rotation=(0.0, 0.0, -(rotation or 0.0)) if isinstance(rotation, (int, float)) else (0.0, 0.0, 0.0),
    )
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    bevel = obj.modifiers.new("soft_edge", "BEVEL")
    bevel.width = min(radius * 0.16, 0.12)
    bevel.segments = 2
    return obj


def add_cone(name, location, radius, depth, material, vertices=8, rotation=0.0):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius,
        radius2=radius * 0.12,
        depth=depth,
        location=game_to_blender(location),
        rotation=(0.0, 0.0, -rotation),
    )
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    return obj


def add_ridge(name, center, radius_x, radius_z, height, material, phase=0.0, segments=12):
    """Build an irregular terraced ridge; avoids the placeholder cone silhouette."""
    cx, cy, cz = center
    levels = ((1.0, 0.0), (0.76, 0.42), (0.43, 0.73), (0.13, 1.0))
    vertices = []
    for level_index, (radius_scale, height_scale) in enumerate(levels):
        for index in range(segments):
            angle = math.tau * index / segments
            irregular = 1.0 + 0.11 * math.sin(index * 2.17 + phase) + 0.06 * math.cos(index * 3.31 - phase)
            lean_x = height_scale * radius_x * 0.08 * math.cos(phase)
            lean_z = height_scale * radius_z * 0.06 * math.sin(phase)
            game_vertex = (
                cx + math.cos(angle) * radius_x * radius_scale * irregular + lean_x,
                cy + height * height_scale,
                cz + math.sin(angle) * radius_z * radius_scale * irregular + lean_z,
            )
            vertices.append(game_to_blender(game_vertex))
    faces = []
    for level_index in range(len(levels) - 1):
        row = level_index * segments
        next_row = (level_index + 1) * segments
        for index in range(segments):
            nxt = (index + 1) % segments
            faces.append((row + index, row + nxt, next_row + nxt, next_row + index))
    faces.append(tuple(reversed(range((len(levels) - 1) * segments, len(levels) * segments))))
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    assign(obj, material)
    return obj


def point_at_s(distance):
    lengths = []
    total = 0.0
    for ax, az, bx, bz in TRACK_SEGS:
        length = math.hypot(bx - ax, bz - az)
        lengths.append((ax, az, bx, bz, length))
        total += length
    rem = distance % total
    for ax, az, bx, bz, length in lengths:
        if rem <= length:
            t = rem / length
            dx, dz = bx - ax, bz - az
            mag = math.hypot(dx, dz)
            nx, nz = -dz / mag, dx / mag
            return {
                "x": ax + dx * t,
                "z": az + dz * t,
                "yaw": math.atan2(dz, dx),
                "nx": nx,
                "nz": nz,
            }
        rem -= length
    ax, az, bx, bz, _ = lengths[-1]
    return {"x": bx, "z": bz, "yaw": math.atan2(bz - az, bx - ax), "nx": 0.0, "nz": 1.0}


def offset_point(point, lateral, forward=0.0):
    return {
        "x": point["x"] + point["nx"] * lateral + math.cos(point["yaw"]) * forward,
        "z": point["z"] + point["nz"] * lateral + math.sin(point["yaw"]) * forward,
    }


def build_river():
    for index, ((ax, az), (bx, bz)) in enumerate(zip(RIVER_PATH, RIVER_PATH[1:])):
        dx, dz = bx - ax, bz - az
        length = math.hypot(dx, dz)
        yaw = math.atan2(dx, dz)
        center = ((ax + bx) * 0.5, -0.82, (az + bz) * 0.5)
        add_box(f"RIVER01_water_{index:02d}", center, (15.0, 0.08, length + 2.0), MAT["water"], yaw, 0.14)
        add_box(f"RIVER01_glint_{index:02d}", (center[0], -0.765, center[2]), (2.4, 0.025, length * 0.72), MAT["water_light"], yaw, 0.05)


def build_bridge():
    bridge = point_at_s(sum(math.hypot(b - a, d - c) for a, c, b, d in TRACK_SEGS) * 0.49)
    x, z, yaw = bridge["x"], bridge["z"], bridge["yaw"]
    add_box("BRIDGE01_deck", (x, 0.30, z), (29.0, 0.62, 9.0), MAT["wood"], yaw, 0.22)
    for lateral in (-11.8, 11.8):
        p = offset_point(bridge, lateral)
        add_box(f"BRIDGE01_guard_{'L' if lateral < 0 else 'R'}", (p["x"], 1.12, p["z"]), (0.34, 1.55, 8.4), MAT["charcoal"], yaw, 0.10)
        for forward in (-3.2, 0.0, 3.2):
            q = offset_point(bridge, lateral, forward)
            add_box(f"BRIDGE01_post_{'L' if lateral < 0 else 'R'}_{forward}", (q["x"], 0.62, q["z"]), (0.42, 1.15, 0.42), MAT["wood_light"], yaw, 0.08)
    for lateral in (-8.5, 8.5):
        p = offset_point(bridge, lateral)
        add_box(f"BRIDGE01_pier_{'L' if lateral < 0 else 'R'}", (p["x"], -1.2, p["z"]), (0.9, 2.5, 1.0), MAT["wood"], yaw, 0.12)


def build_rest_stop():
    point = point_at_s(sum(math.hypot(b - a, d - c) for a, c, b, d in TRACK_SEGS) * 0.28)
    x, z, yaw = offset_point(point, 42)["x"], offset_point(point, 42)["z"], point["yaw"]
    add_box("REST01_platform", (x, 0.38, z), (15.0, 0.55, 10.0), MAT["cream"], yaw, 0.20)
    for lateral in (-5.5, 5.5):
        p = offset_point({"x": x, "z": z, "nx": -math.sin(yaw), "nz": math.cos(yaw), "yaw": yaw}, lateral)
        add_box(f"REST01_post_{lateral}", (p["x"], 4.2, p["z"]), (0.52, 7.6, 0.52), MAT["charcoal"], yaw, 0.10)
    add_box("REST01_roof", (x, 8.35, z), (17.0, 0.55, 11.0), MAT["coral"], yaw, 0.18)
    sign = offset_point({"x": x, "z": z, "nx": -math.sin(yaw), "nz": math.cos(yaw), "yaw": yaw}, 0, -5.0)
    add_box("REST01_sign", (sign["x"], 4.6, sign["z"]), (5.2, 1.0, 0.28), MAT["gold"], yaw, 0.10)
    add_cylinder("REST01_lamp", (x, 7.7, z), 0.55, 0.28, MAT["mint"], 12)


def build_destination():
    point = point_at_s(sum(math.hypot(b - a, d - c) for a, c, b, d in TRACK_SEGS) * 0.72)
    p = offset_point(point, 46)
    x, z, yaw = p["x"], p["z"], point["yaw"]
    add_cylinder("DEST01_base", (x, 3.2, z), 5.2, 6.4, MAT["hill"], 8)
    add_box("DEST01_tower", (x, 10.0, z), (4.4, 14.0, 4.4), MAT["hill"], yaw, 0.28)
    add_box("DEST01_ring", (x, 17.2, z), (7.0, 0.65, 7.0), MAT["gold"], yaw, 0.18)
    add_cone("DEST01_cap", (x, 21.4, z), 5.4, 6.0, MAT["coral"], 6, yaw)
    add_cylinder("DEST01_beacon", (x, 11.8, z - 2.35), 0.95, 0.28, MAT["mint"], 16)


def build_hills():
    hills = [
        (-330, 258, 70, 47, 25, MAT["hill"]),
        (-215, 286, 56, 38, 18, MAT["hill_light"]),
        (12, 278, 82, 50, 29, MAT["hill"]),
        (282, 270, 88, 56, 31, MAT["hill_light"]),
    ]
    for index, (x, z, radius_x, radius_z, height, material) in enumerate(hills):
        add_ridge(f"HILL01_mass_{index}", (x, -1.55, z), radius_x, radius_z, height, material, 0.8 * index)


def build_route_markers():
    point = point_at_s(sum(math.hypot(b - a, d - c) for a, c, b, d in TRACK_SEGS) * 0.51)
    for side in (-6.0, 6.0):
        p = offset_point(point, side)
        add_box(f"MARK01_post_{side}", (p["x"], 2.2, p["z"]), (0.36, 4.4, 0.36), MAT["gold"], point["yaw"], 0.08)
        add_box(f"MARK01_flag_{side}", (p["x"], 4.35, p["z"]), (2.3, 0.32, 0.36), MAT["coral"], point["yaw"], 0.06)


def setup_preview():
    world = bpy.context.scene.world
    world.color = (0.10, 0.18, 0.22)
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.10, 0.18, 0.22, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
    bpy.ops.object.camera_add(location=game_to_blender((0, 150, -390)))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    target = Vector(game_to_blender((0, 7, 115)))
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 52
    bpy.context.scene.camera = camera
    bpy.ops.object.light_add(type="AREA", location=game_to_blender((-35, 72, -40)))
    key = bpy.context.object
    key.data.energy = 2600
    key.data.shape = "DISK"
    key.data.size = 45
    key.rotation_euler = (Vector(game_to_blender((235, 2, 200))) - key.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="AREA", location=game_to_blender((48, 30, 35)))
    fill = bpy.context.object
    fill.data.energy = 1100
    fill.data.size = 35
    fill.rotation_euler = (Vector(game_to_blender((235, 2, 200))) - fill.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="SUN", location=game_to_blender((120, 120, 70)))
    sun = bpy.context.object
    sun.data.energy = 3.2
    sun.rotation_euler = (Vector(game_to_blender((235, 0, 200))) - sun.location).to_track_quat("-Z", "Y").to_euler()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 1.0
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 760
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(OUT_DIR, f"{ASSET_ID}-preview.png")
    scene.render.film_transparent = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, f"{ASSET_ID}_source.blend"))
    bpy.ops.render.render(write_still=True)


def export_glb():
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT_DIR, f"{ASSET_ID}_LOD0.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
    )


def main():
    clear_scene()
    setup_materials()
    build_river()
    build_bridge()
    build_rest_stop()
    build_destination()
    build_hills()
    build_route_markers()
    setup_preview()
    export_glb()
    print(f"{ASSET_ID} complete")


if __name__ == "__main__":
    main()
