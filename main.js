$(document).ready(function () {
    function getToken() { //---------- RECUPERER DYNAMIQUEMENT LE TOKEN ----------
        return fetch('https://admindata.atmo-france.org/api/login', { //url pour accéder au site de l'API
            method: 'POST',
            body: JSON.stringify({ //On envoie l'username et le password en chaine de caractères
                username: "mathieu",
                password: "Sae303Mathieu"
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((resp) => { //Le code reçoie une réponse
            if (!resp.ok) { //Si la réponse n'est pas positive
                throw new Error('Echec de la requete' + resp.status); // Renvoie l'érreur
            }
            return resp.json();
        }).then((data) => { //Le code reçoie une réponse
            if (!data.token) { //S'il y a un problème avec la réception du token
                throw new Error('Token inconnu');
            }
            return data.token; //Renvoie le Token
        });
    }

    function getData(token) { //---------- DEMANDER L'ACCES GRACE AU TOKEN ----------
        var urlIdDonnees = "112";
        var urlDate = '["2022-01-01", "2022-01-02"]';

        //La requête des données qu'on veut

        //const urlPath = `{"code_zone":{"operator":"=","value":"${urlCodeZone}"},"date_ech":{"operator":">=","value":"${urlDate}"}}`;
        const urlPath = `{"date_ech":{"operator":"IN","value":${urlDate}}}`;
        const urlQueryParams = 'withGeom=false'
        /**
         * Pour tester le code sans surcharger l'API, nous sommes passés par un fichier JSON
         */
        //const url = `https://admindata.atmo-france.org/api/data/${urlIdDonnees}/${urlPath}?${urlQueryParams}`;
        const url = './data.json'; //Fichier regroupant les données récoltées par l'API
        return fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}` //On rajoute des données à notre requête, ici on envoie notre variable token dans le paramètre 'Authorization'
            }
        });
    }

    const p1 = getToken().then((token) => getData(token)).then((resp) => {
        if (!resp.ok) {
            throw new Error(`Request failed with status ${resp.status} (${resp.statusText})`); //Si le fetch ne lève pas d'exeption
        }
        return resp.json();
    });

    const p2 = d3.csv("./covoiturage_donnees.csv", (ligne) => {

        return {
            code_departement: ligne.code_departement,
            insee: ligne.insee,
            moyenne_finale : Number (ligne.moyenne_finale),
            CodeQual: Number(ligne.CodeQual)
        };
    });

    function carteMixte() {
        
        Promise.all([p1, p2]).then(([donneesPollution, covoiturageData]) => {

            const dicoInfoDeptParInsee = {};
            covoiturageData.forEach((infoDept) => {
                d3.select("#dep_" + infoDept.code_departement).style("fill", "gray");
                dicoInfoDeptParInsee[infoDept.insee] = infoDept;
            });
            const dicoCouleur = {
                1: 'rgb(212,246,234)', //Couleur Bas
                2: 'rgb(174,225,125)', //Couleur bas - gauche
                3: 'rgb(158,247,105)', // Couleur milieu - gauche
                4: 'rgb(101,218,180)', // Couleur milieu
                5: 'rgb(159,225,255)', //Couleur bas-droite
                6: 'rgb(5,78,82)', // Couleur haut
                7: 'rgb(44,189,255)', // Couleur droite
                8: 'rgb(102,154,52)', //Couleur haut - gauche
                9: 'rgb(0,150,177)', //Couleur haut - droite
                8: 'rgb(158,247,105)', 
               
                default: 'pink' // notre valeur par défaut
            }

            donneesPollution.features.forEach((feature) => {
                const infoDept = dicoInfoDeptParInsee[feature.properties.code_zone];
                if (!infoDept) {
                    return;
                }
                const couleurPollution = feature.properties.code_qual in dicoCouleur ? dicoCouleur[feature.properties.code_qual] : dicoCouleur.default;
                d3.select("#dep_" + infoDept.code_departement).style("fill", couleurPollution);
            });

            covoiturageData.forEach((infoDept) => {

                var cheminPath = d3.select("#dep_" + infoDept.code_departement);
                if (cheminPath.style("fill") === "gray") {
                    const couleur = infoDept.CodeQual in dicoCouleur ? dicoCouleur[infoDept.CodeQual] : dicoCouleur.default;
                    d3.select("#dep_" + infoDept.code_departement).style("fill", couleur);
                } 

                var codeQualCovoiturage;

                    if (infoDept.moyenne_finale > 0 && infoDept.moyenne_finale <= 400) { //Trajets entre 0 et 500
                        codeQualCovoiturage = 1;
                    } else if (infoDept.moyenne_finale > 400 && infoDept.moyenne_finale <= 4000) { //Trajets entre 500 et 4000
                        codeQualCovoiturage = 2;
                    } else if (infoDept.moyenne_finale > 4000) { //Trajets supérieur à 4000
                        codeQualCovoiturage = 3;
                    } else {
                        d3.selectAll("#dep_" + infoDept.code_departement).style("fill", "gray");
                    }

                var codeQualFinal;

                console.log(cheminPath.style("fill"));
    
                if (cheminPath.style("fill") == 'rgb(212, 246, 234)') {
                    if (codeQualCovoiturage == 2) {
                        codeQualFinal = 5;
                    } else if (codeQualCovoiturage == 3) {
                        codeQualFinal = 7;
                    } else {
                        codeQualFinal = 1;
                    }
                }
                
                if (cheminPath.style("fill") == 'rgb(174, 225, 125)') {
                    if (codeQualCovoiturage == 2) {
                        codeQualFinal = 4;
                    } else if (codeQualCovoiturage == 3) {
                        codeQualFinal = 9;
                    } else {
                        codeQualFinal = 2;
                    }
                }
    
                if (cheminPath.style("fill") == 'rgb(158, 247, 105)') {
                    if (codeQualCovoiturage == 2) {
                        codeQualFinal = 8;
                    } else if (codeQualCovoiturage == 3) {
                        codeQualFinal = 6;
                    } else {
                        codeQualFinal = 3;
                    }
                }
    
                const couleurFinale = codeQualFinal in dicoCouleur ? dicoCouleur[codeQualFinal] : dicoCouleur.default;
                d3.select("#dep_" + infoDept.code_departement).style("fill", couleurFinale);
            });                

        }, (err) => {
            console.warn("Mince !", err);
        });

    }

    function carteCovoiturage() {
        d3.csv("./covoiturage_donnees.csv", function (covoiturageData) {
            if (covoiturageData.moyenne_finale > 0 && covoiturageData.moyenne_finale <= 400) { //Trajets entre 0 et 500
                d3.selectAll("#dep_" + covoiturageData.code_departement).style("fill", "rgb(212,246,234)");
            } else if (covoiturageData.moyenne_finale > 400 && covoiturageData.moyenne_finale <= 4000) { //Trajets entre 500 et 4000
                d3.selectAll("#dep_" + covoiturageData.code_departement).style("fill", "rgb(159,225,255)");
            } else if (covoiturageData.moyenne_finale > 4000) { //Trajets supérieur à 4000
                d3.selectAll("#dep_" + covoiturageData.code_departement).style("fill", "rgb(44,189,255)");
            } else {
                d3.selectAll("#dep_" + covoiturageData.code_departement).style("fill", "gray");
            }
        });
    }

    function cartePollution() {
        Promise.all([p1, p2]).then(([donneesPollution, covoiturageData]) => {

            const dicoInfoDeptParInsee = {};
            covoiturageData.forEach((infoDept) => {
                d3.select("#dep_" + infoDept.code_departement).style("fill", "gray");
                dicoInfoDeptParInsee[infoDept.insee] = infoDept;
                console.log(infoDept);
            });
            const dicoCouleur = {
                1: 'rgb(212,246,234)', //Couleur Bas
                2: 'rgb(174,225,125)', //Couleur bas - gauche
                3: 'rgb(158,247,105)', // Couleur milieu - gauche

                default: 'gray' // notre valeur par défaut
            }
            donneesPollution.features.forEach((feature) => {
                const infoDept = dicoInfoDeptParInsee[feature.properties.code_zone];
                if (!infoDept) {
                    return;
                }
                const couleur = feature.properties.code_qual in dicoCouleur ? dicoCouleur[feature.properties.code_qual] : dicoCouleur.default;
                d3.select("#dep_" + infoDept.code_departement).style("fill", couleur);
            });

            covoiturageData.forEach((infoDept) => {
                var cheminPath = d3.select("#dep_" + infoDept.code_departement);
                if (cheminPath.style("fill") === "gray") {
                    const couleur = infoDept.CodeQual in dicoCouleur ? dicoCouleur[infoDept.CodeQual] : dicoCouleur.default;
                    d3.select("#dep_" + infoDept.code_departement).style("fill", couleur);
                } else {
                    return;
                }
            });
        }, (err) => {
            console.warn("Mince !", err);
        });
    }

    carteMixte();


    //----------------- FONCTIONS INTERACTIONS ------------------

    $('.global').on('click', function () {
        $('.global').addClass('selected');
        $('.pollution').removeClass('selected');
        $('.covoiturage').removeClass('selected');
            carteMixte();
    })
    $('.pollution').on('click', function () {
        $('.pollution').addClass('selected');
        $('.global').removeClass('selected');
        $('.covoiturage').removeClass('selected');
            cartePollution();
    })
    $('.covoiturage').on('click', function () {
        $('.covoiturage').addClass('selected');
        $('.global').removeClass('selected');
        $('.pollution').removeClass('selected');
            carteCovoiturage();
    });
});