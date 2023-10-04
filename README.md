# Open world generator
Create proceduraly generated landscape using different kinds of noise. 
You can achive different kinds of terrain shapes by conecting different kinds of nodes, (similar to how blender shader editing works). The same noise can be used to influence whether a decoraton could apear at certain position as well a probability of it's apearance. 
Assets like textures and models are loaded by providing it's URL, but keep in mind if you are using URL to external domain that server should allow usage of it's content by setting coresponding *Cross-Origin Resource Sharing* header.

## Build
To build run:

    npm install
    npm run build
    
Then you can open it by using simple server like **five-server**.

    five-server dist

To install **five-server** globally run:

    npm -g install
    