import os
import bpy

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_ID = "OPEN-FIELD-SCENERY-01"


def inspect(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    vertices = sum(len(obj.data.vertices) for obj in meshes)
    materials = sorted({mat.name for obj in meshes for mat in obj.data.materials if mat})
    print(f"VALID {os.path.basename(path)} meshes={len(meshes)} vertices={vertices} materials={len(materials)}")


for label in ("LOD0", "LOD1", "LOD2"):
    asset_dir = ROOT_DIR if label == "LOD0" else os.path.join(ROOT_DIR, "source")
    inspect(os.path.join(asset_dir, f"{ASSET_ID}_{label}.glb"))
