    ==============================================================================================================


    A proxy server for retrieving ccp files using their human readable file path as an input


         1. It will use your local game directory files first (if you provide the directory)
         2. Then it will fallback to a using a local cache second
         3. Then it will fallback to ccp's content delivery network (cdn) and store the 
            results in your local cache directory

         CCP stores files as hash file names locally and on their server (for version control)
         - CCPWGL needs the human readable file names to work
         - Humans needs human readable file names to work (And cookies)

                human: "dx9/model/spaceobjectfactory/data.black"
                hash:  "35/350cf81f2f26b64b_176410753cf4e27b375ad74009318b7d"


    ==============================================================================================================

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
                            
                            