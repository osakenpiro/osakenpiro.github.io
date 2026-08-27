import bpy
import math
from pathlib import Path
from mathutils import Vector


OUT = Path(__file__).resolve().parent
GLB_PATH = OUT / "KART-01_LOD0.glb"
VEHICLE_COLLECTION = "KART-01"
vehicle_objects = []


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def get_vehicle_collection():
    collection = bpy.data.collections.get(VEHICLE_COLLECTION)
    if collection is None:
        collection = bpy.data.collections.new(VEHICLE_COLLECTION)
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection, include=True):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    if include and obj not in vehicle_objects:
        vehicle_objects.append(obj)
    obj["asset_id"] = "KART-01"
    obj["asset_stage"] = "LOD0"


def make_material(name, color, metallic=0.0, roughness=0.42, coat=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1.0)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if bsdf.inputs.get("Base Color"):
            bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        if bsdf.inputs.get("Metallic"):
            bsdf.inputs["Metallic"].default_value = metallic
        if bsdf.inputs.get("Roughness"):
            bsdf.inputs["Roughness"].default_value = roughness
        if bsdf.inputs.get("Coat Weight"):
            bsdf.inputs["Coat Weight"].default_value = coat
        if bsdf.inputs.get("Coat Roughness"):
            bsdf.inputs["Coat Roughness"].default_value = 0.22
    return mat


CREAM = make_material("paint_main", (0.78, 0.58, 0.30), metallic=0.05, roughness=0.28, coat=0.25)
ORANGE = make_material("paint_accent", (0.82, 0.18, 0.045), metallic=0.05, roughness=0.3, coat=0.2)
TEAL = make_material("glass_teal", (0.018, 0.10, 0.12), metallic=0.1, roughness=0.17, coat=0.55)
CHARCOAL = make_material("protection_charcoal", (0.025, 0.028, 0.03), metallic=0.25, roughness=0.32)
RUBBER = make_material("rubber", (0.012, 0.012, 0.011), roughness=0.78)
HUB = make_material("hub_gunmetal", (0.16, 0.17, 0.17), metallic=0.72, roughness=0.24)
GOLD = make_material("signal_gold", (0.75, 0.37, 0.055), metallic=0.75, roughness=0.22)
LAMP = make_material("lamp_warm", (1.0, 0.42, 0.08), metallic=0.0, roughness=0.18)
GROUND = make_material("diorama_ground", (0.12, 0.085, 0.06), roughness=0.9)


def apply_bevel(obj, width=0.04, segments=3):
    mod = obj.modifiers.new(name="authored_edge_bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)


def smooth(obj):
    if hasattr(obj.data, "polygons"):
        for poly in obj.data.polygons:
            poly.use_smooth = True


def cube(name, location, dimensions, material, bevel=0.04, rotation=(0, 0, 0), include=True):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        apply_bevel(obj, bevel, 3)
    obj.data.materials.append(material)
    move_to_collection(obj, get_vehicle_collection(), include=include)
    return obj


def prism(name, y0, y1, w0, w1, z0, z1, material, top_ratio=0.78, include=True):
    vertices = [
        (-w0, y0, z0), (w0, y0, z0), (w1, y1, z0), (-w1, y1, z0),
        (-w0 * top_ratio, y0, z1), (w0 * top_ratio, y0, z1),
        (w1 * top_ratio, y1, z1), (-w1 * top_ratio, y1, z1),
    ]
    faces = [
        (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
        (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
    ]
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    get_vehicle_collection().objects.link(obj)
    apply_bevel(obj, 0.035, 3)
    obj.data.materials.append(material)
    move_to_collection(obj, get_vehicle_collection(), include=include)
    return obj


def cylinder_between(name, a, b, radius, material, vertices=16, include=True):
    a = Vector(a)
    b = Vector(b)
    direction = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=(a + b) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(material)
    move_to_collection(obj, get_vehicle_collection(), include=include)
    return obj


def torus(name, location, major, minor, material, rotation=(0, 0, 0), include=True):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=36,
        minor_segments=14,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    smooth(obj)
    obj.data.materials.append(material)
    move_to_collection(obj, get_vehicle_collection(), include=include)
    return obj


def sphere(name, location, scale, material, include=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    obj.data.materials.append(material)
    move_to_collection(obj, get_vehicle_collection(), include=include)
    return obj


def contact_empty(name, location):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=location)
    obj = bpy.context.object
    obj.name = name
    obj.empty_display_size = 0.08
    move_to_collection(obj, get_vehicle_collection(), include=True)
    obj["contact_type"] = "tire_contact"
    return obj


def make_wheel(prefix, x, y, z=0.5):
    torus(prefix + "_tire", (x, y, z), 0.36, 0.13, RUBBER, rotation=(0, math.pi / 2, 0))
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.22, depth=0.13, location=(x, y, z), rotation=(0, math.pi / 2, 0))
    hub = bpy.context.object
    hub.name = prefix + "_hub"
    hub.data.materials.append(HUB)
    move_to_collection(hub, get_vehicle_collection(), include=True)
    torus(prefix + "_hub_ring", (x + (0.072 if x > 0 else -0.072), y, z), 0.18, 0.025, GOLD, rotation=(0, math.pi / 2, 0))
    for i in range(14):
        angle = 2 * math.pi * i / 14
        tread_y = y + math.cos(angle) * 0.36
        tread_z = z + math.sin(angle) * 0.36
        block = cube(prefix + "_tread_%02d" % i, (x, tread_y, tread_z), (0.285, 0.085, 0.085), RUBBER, bevel=0.018, rotation=(angle, 0, 0))
    contact_empty(prefix + "_CONTACT", (x, y, 0.035))


def build_vehicle():
    collection = get_vehicle_collection()
    body = prism("KART01_body_main", -1.35, 0.35, 0.28, 0.66, 0.52, 0.88, CREAM, top_ratio=0.78)
    nose = prism("KART01_body_nose", -1.62, -0.38, 0.14, 0.38, 0.66, 0.94, ORANGE, top_ratio=0.78)
    cube("KART01_nose_inlay", (0, -1.19, 0.945), (0.16, 0.78, 0.035), CREAM, bevel=0.012)
    cube("KART01_floor_plate", (0, 0.08, 0.39), (1.38, 2.65, 0.12), CHARCOAL, bevel=0.045)
    cube("KART01_sidepod_L", (-0.72, 0.32, 0.66), (0.36, 1.0, 0.30), CREAM, bevel=0.075)
    cube("KART01_sidepod_R", (0.72, 0.32, 0.66), (0.36, 1.0, 0.30), CREAM, bevel=0.075)
    cube("KART01_sidepod_accent_L", (-0.912, 0.34, 0.70), (0.018, 0.78, 0.095), ORANGE, bevel=0.01)
    cube("KART01_sidepod_accent_R", (0.912, 0.34, 0.70), (0.018, 0.78, 0.095), ORANGE, bevel=0.01)
    cube("KART01_rear_engine", (0, 0.98, 1.02), (0.72, 0.62, 0.56), CHARCOAL, bevel=0.09)
    cube("KART01_engine_cover", (0, 0.88, 1.31), (0.63, 0.38, 0.09), ORANGE, bevel=0.025)
    cube("KART01_seat", (0, 0.54, 1.02), (0.53, 0.58, 0.68), TEAL, bevel=0.12)
    cube("KART01_seat_base", (0, 0.55, 0.72), (0.68, 0.62, 0.16), CHARCOAL, bevel=0.045)

    for side in (-1, 1):
        x = side * 0.42
        cylinder_between("KART01_roll_post_%s" % side, (x, 0.78, 0.82), (x, 0.86, 1.92), 0.055, CHARCOAL)
        cylinder_between("KART01_roll_back_%s" % side, (x, 0.86, 1.92), (x, 0.50, 1.72), 0.045, CHARCOAL)
    cylinder_between("KART01_roll_top", (-0.42, 0.86, 1.92), (0.42, 0.86, 1.92), 0.055, CHARCOAL)
    cylinder_between("KART01_roll_mid", (-0.42, 0.52, 1.72), (0.42, 0.52, 1.72), 0.04, CHARCOAL)

    cylinder_between("KART01_steering_column", (0, -0.18, 0.94), (0, -0.02, 1.27), 0.035, CHARCOAL)
    torus("KART01_steering_wheel", (0, -0.02, 1.30), 0.18, 0.035, CHARCOAL, rotation=(math.pi / 2, 0, 0))
    cylinder_between("KART01_steering_spoke_L", (-0.15, -0.02, 1.30), (0, -0.02, 1.30), 0.018, GOLD)
    cylinder_between("KART01_steering_spoke_R", (0.15, -0.02, 1.30), (0, -0.02, 1.30), 0.018, GOLD)

    cylinder_between("KART01_front_bumper", (-0.65, -1.68, 0.47), (0.65, -1.68, 0.47), 0.055, CHARCOAL)
    cylinder_between("KART01_front_guard_L", (-0.65, -1.68, 0.47), (-0.54, -1.43, 0.63), 0.045, CHARCOAL)
    cylinder_between("KART01_front_guard_R", (0.65, -1.68, 0.47), (0.54, -1.43, 0.63), 0.045, CHARCOAL)
    cylinder_between("KART01_left_rail", (-0.86, -0.82, 0.49), (-0.86, 0.78, 0.49), 0.035, CHARCOAL)
    cylinder_between("KART01_right_rail", (0.86, -0.82, 0.49), (0.86, 0.78, 0.49), 0.035, CHARCOAL)

    for side in (-1, 1):
        x = side * 0.97
        for y in (-1.14, 1.10):
            make_wheel("KART01_%s_%s" % ("L" if side < 0 else "R", "F" if y < 0 else "R"), x, y)
        cylinder_between("KART01_front_susp_%s" % side, (side * 0.52, -1.02, 0.73), (x, -1.14, 0.63), 0.028, GOLD)
        cylinder_between("KART01_rear_susp_%s" % side, (side * 0.52, 0.78, 0.78), (x, 1.10, 0.63), 0.028, GOLD)

    for x in (-0.22, 0.22):
        sphere("KART01_front_lamp_%s" % x, (x, -1.56, 0.73), (0.075, 0.045, 0.075), LAMP)
    sphere("KART01_engine_badge", (0, 1.31, 1.08), (0.11, 0.035, 0.11), GOLD)
    collection["vehicle_type"] = "kart"
    collection["roster_id"] = "KART-01"
    collection["physics_note"] = "responsive steering and deliberate drift"


def aim(camera, target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def make_camera():
    bpy.ops.object.camera_add(location=(5.2, -6.8, 3.35))
    camera = bpy.context.object
    camera.name = "KART01_preview_camera"
    camera.data.lens = 58
    camera.data.sensor_width = 36
    aim(camera, (0, -0.05, 0.82))
    bpy.context.scene.camera = camera
    return camera


def make_light(name, location, energy, size, color):
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    light.data.color = color
    aim(light, (0, 0, 0.7))
    return light


def make_stage():
    cube("PREVIEW_ground", (0, 0, -0.10), (12, 12, 0.18), GROUND, bevel=0.08, include=False)
    bpy.ops.object.light_add(type="AREA", location=(0, 0, 6.5))
    key = bpy.context.object
    key.name = "PREVIEW_key_light"
    key.data.energy = 1000
    key.data.shape = "DISK"
    key.data.size = 5.0
    key.data.color = (1.0, 0.72, 0.48)
    aim(key, (0, 0, 0.4))
    make_light("PREVIEW_fill", (-4.0, -3.0, 3.0), 720, 4.0, (0.46, 0.62, 1.0))
    make_light("PREVIEW_rim", (4.0, 3.0, 3.2), 900, 3.0, (1.0, 0.36, 0.12))


def render_views(camera):
    scene = bpy.context.scene
    views = {
        "front": (5.2, -6.8, 3.35),
        "side": (6.9, 0.8, 2.65),
        "rear": (-4.8, 5.8, 3.0),
        "top": (4.5, -4.9, 6.6),
    }
    for tag, location in views.items():
        camera.location = location
        aim(camera, (0, 0.05, 0.82))
        scene.render.filepath = str(OUT / ("KART-01-preview-%s.png" % tag))
        bpy.ops.render.render(write_still=True)


def export_glb():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in vehicle_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(obj for obj in vehicle_objects if obj.type == "MESH")
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_animations=False,
    )
    bpy.ops.object.select_all(action="DESELECT")


def configure_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.color = (0.018, 0.012, 0.009)
    scene.render.filepath = str(OUT / "KART-01-preview-front.png")
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass


def main():
    clear_scene()
    configure_scene()
    build_vehicle()
    make_stage()
    camera = make_camera()
    export_glb()
    render_views(camera)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "KART-01_source.blend"))
    print("KART-01 export complete:", GLB_PATH)
    print("vehicle_objects:", len(vehicle_objects))


if __name__ == "__main__":
    main()
