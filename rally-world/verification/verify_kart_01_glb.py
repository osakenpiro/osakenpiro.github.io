import bpy
from pathlib import Path

root = Path(__file__).resolve().parent.parent
for lod in ("LOD0", "LOD1", "LOD2"):
    path = (root if lod == "LOD0" else root / "source") / ("KART-01_%s.glb" % lod)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    result = bpy.ops.import_scene.gltf(filepath=str(path))
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    materials = sorted({mat.name for obj in mesh_objects for mat in obj.data.materials if mat})
    vertices = sum(len(obj.data.vertices) for obj in mesh_objects)
    print("LOD", lod, "IMPORT_RESULT", result, "EXISTS", path.exists(), "MESH_OBJECTS", len(mesh_objects), "VERTICES", vertices, "MATERIALS", len(materials), "BOUNDS_READY", all(len(obj.data.vertices) > 0 for obj in mesh_objects))
