import os
import subprocess
import pathlib

if __name__ == '__main__':
    glslang_cmd = "glslangValidator"

    shader_list = ["simple.vert", "quad.vert", "quad.frag", "simple_shadow.frag", "simple.geom", "vsm.frag"]

    for shader in shader_list:
        subprocess.run([glslang_cmd, "-V", "-g", shader, "-o", "{}.spv".format(shader)])

