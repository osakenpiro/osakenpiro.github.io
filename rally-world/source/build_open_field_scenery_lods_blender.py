import os
import bpy

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSET_ID = "OPEN-FIELD-SCENERY-01"


def export_selected(path):
    bpy.ops.object.select_all(action="DESELECT")
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in meshes:
        obj.select_set(True)
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
    )
    return meshes


def build_lod(label, ratio):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT_DIR, f"{ASSET_ID}_LOD0.glb"))
    for obj in [item for item in bpy.context.scene.objects if item.type == "MESH"]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new(f"{label}_decimate", "DECIMATE")
        modifier.ratio = ratio
        try:
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        except RuntimeError:
            obj.modifiers.remove(modifier)
        obj.select_set(False)
    meshes = export_selected(os.path.join(OUT_DIR, f"{ASSET_ID}_{label}.glb"))
    vertices = sum(len(obj.data.vertices) for obj in meshes)
    print(f"{ASSET_ID} {label}: meshes={len(meshes)} vertices={vertices}")


def main():
    build_lod("LOD1", 0.55)
    build_lod("LOD2", 0.25)
    print(f"{ASSET_ID} LOD build complete")


main()
