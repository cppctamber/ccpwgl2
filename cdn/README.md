    ==============================================================================================================

    i) Provides static json files which contain information missing in ESI.
       This is a temporary service until this data is added to ESI and isn't cached or optimised in any way.
        
       USAGE:
           
            cdn:/static/moons/{moonID}
                 - height_map_1  - Graphic id for the moon's 1st height map
                 - height_map_2  - Graphic id for the moon's 2nd height map
                 - shader_preset - Graphic id for the moon's shader
                 - radius        - Radius of the moon
                 
            cdn:/static/planets/{planetsID}
                  - height_map_1  - Graphic id for the planet's 1st height map
                  - height_map_2  - Graphic id for the planet's 2nd height map
                  - shader_preset - Graphic id for the planet's shader
                  - radius        - Radius of the planet
                 
            cdn:/static/regions/{regionID}
                  - nebula        - Graphic id for the region
                  

    ==============================================================================================================

    ii) A proxy server for retrieving ccp files using their human readable file path as an input

        Services:
             - Provides cors headers (cdn doesn't and webgl needs them)
             - Provides ccpwgl resource quality suffixes (cdn uses a different system)
             - Provides local file caching (if required)
             - Provides file name mapping
         
        File sources:
            1. It will use your local game directory first (if you provide the directory with the -dir argument)
            2. It will fallback to using local cache (if the file exists) 
            3. It will fallback to ccp's content delivery network (cdn) and store in local cache

        File names:
            CCP stores files with hashes as names (locally and on the cdn)
                - ccpwgl needs human readable file names
                - humans needs human readable file names to not go insane (And cookies)

                    human: "dx9/model/spaceobjectfactory/data.black"
                    hash:  "35/350cf81f2f26b64b_176410753cf4e27b375ad74009318b7d"

        Support:
            The ccpwgl library is tested with the supplied `resfileindex.txt`, other versions may not work
         

    USAGE:

        server:         "node server [...arguments]"
        -------
                        example: 
                        
                            "node server -json true"


        arguments:

             -port [integer=3000]                        : The port you want your server to use
             -index [filePath="./resfileindex.txt"]      : Your source resfileindex file path
             -dest [filePath="./cache/"]                 : The destination cache directory
             -dir [filePath=null]                        : The path to your game res folder
             -cdn [filePath="developers.eveonline.com/"] : The remote ccp cdn url
             -json [boolean="false"]                     : Generates a json version of the resfileindex




        browser:        "http://localhost:[PORT]/[eve_file_path.extension]"
        --------
                        example: 
                        
                            "http://localhost:3000/dx9/model/spaceobjectfactory/data.black"



        ccpwgl_int:     set the "cdn" path in "./src/config.js" object to match your localhost path
        -----------
                        example:

                            paths: {
                                "res": "https://developers.eveonline.com/ccpwgl/assetpath/1097993/",
                                "cdn" : "http://localhost:3000/"
                            },


           
                    
        ccpwgl:         "ccpwgl_int.GetObject("cdn:/eve_file_path.extension", onLoaded, onError)";
        -------                    
                        example:
                    
                            ccpwgl_int.GetObject(
                                "cdn:/dx9/model/spaceobjectfactory/data.black", 
                                 onLoaded, 
                                 onError
                            );
                            
