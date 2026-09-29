// Le Narrateur est revenu. Il a vu plus grand, et il n'a toujours rien pardonné.

export const pick = (a) => a[(Math.random() * a.length) | 0];

export const Q = {
  taglines: [
    "Avant, on cassait des appartements. Maintenant, on casse des codes postaux.",
    "Le plan local d'urbanisme, c'est nous qui le réécrivons. Au burin.",
    "Un quartier, c'est comme une réputation : ça met des siècles à se bâtir et un après-midi à disparaître.",
    "Ici, le permis de démolir est délivré sur simple présentation d'une masse.",
    "Le promoteur voulait du neuf. Il va avoir de la place.",
    "Tout est cassable. Même le sol. Surtout le sol.",
  ],

  intro: {
    affaires: [
      "Le quartier d'affaires. Des tours de verre pleines de gens qui déplacent de l'argent. Aujourd'hui, on déplace les tours.",
      "La Bourse, les banques, les boutiques de luxe. Le marché va connaître une correction. Sévère.",
    ],
    aeroport: [
      "Un aéroport. Tous les vols sont retardés. Définitivement.",
      "Veuillez ôter votre ceinture, vos chaussures et le terminal. Merci de votre compréhension.",
    ],
    port: [
      "Le port. Des milliers de conteneurs, trois grues et un cargo. Le fret va arriver en vrac. Très en vrac.",
      "Zone portuaire. Ici, tout est prévu pour résister aux tempêtes. Pas à vous.",
    ],
    centre: [
      "Le centre commercial. Tout doit disparaître : ce n'est plus un slogan, c'est un programme.",
      "Deux étages de boutiques. Les soldes, c'est maintenant, et c'est moins cent pour cent.",
    ],
    chateau: [
      "Un château fort. Huit siècles de sièges, de catapultes et de béliers. Personne n'était venu avec un bulldozer.",
      "Bourrinfort. Des murs de trois mètres d'épaisseur. On va vérifier ça.",
    ],
    centrale: [
      "Une centrale nucléaire. Le seul endroit où le mot « fusion » n'est pas une bonne nouvelle.",
      "Consignes de sécurité : ne pas taper sur les réacteurs. Personne ne lit jamais les consignes.",
    ],
    lune: [
      "La Lune. Gravité réduite : tout ce que vous cassez tombe au ralenti. Prenez le temps d'admirer.",
      "Un petit pas pour l'homme, un grand coup de masse pour l'humanité.",
    ],
    tropiques: [
      "Le sable blanc, les cocotiers, le rhum. Le paradis. Enfin, pour l'instant.",
      "Un village les pieds dans l'eau. Vous allez lui apprendre la marée noire, version gravats.",
    ],
    gare: [
      "La gare. En raison d'un mouvement social de la masse, le trafic est fortement perturbé.",
      "Une grande halle de verre, des trains à l'heure. On va rétablir la tradition du retard.",
    ],
  },

  weapon: {
    masse: "La masse. Au début de toute civilisation, il y a un type qui a tapé sur un caillou. On perpétue.",
    golf: "Le club de golf. Pas de balle aujourd'hui : on joue directement sur la carrosserie. Par 4.",
    roquette: "Le lance-roquettes. Quand on veut qu'une conversation se termine vite et de loin.",
    pistoleau: "Le pistolet à eau. Pour les enfants de 3 à 99 ans. Surtout pour ceux qui veulent raser un quartier en rigolant.",
    piolet: "Les piolets. Quand on ne peut pas faire tomber l'immeuble, on monte le faire tomber d'en haut.",
    bombe: "La bombe atomique. On ne rigole pas avec ça. Enfin si, un peu, mais de loin.",
    pelle: "La pelle. Tout ce qui est construit repose sur quelque chose. Enlevez le quelque chose.",
    mine: "La mine. Collez, reculez, admirez. C'est la méthode Assimil de la démolition.",
  },

  combo: [
    "Ça, c'est de l'aménagement du territoire. Brutal, mais cohérent.",
    "On ne démolit pas un quartier, on lui offre une deuxième chance. En miettes.",
    "Voilà. Là, on commence à parler le même langage que les bulldozers.",
    "Si l'architecte voit ça, il se reconvertit dans la poterie.",
    "Du travail de pro. Rapide, bruyant, et pas du tout remboursé.",
  ],
  idle: [
    "Vous admirez le paysage ? Il ne va pas se démolir tout seul.",
    "On est payé à la casse, pas à la visite guidée.",
    "Le chronomètre tourne. Les bâtiments, eux, sont toujours debout. C'est gênant.",
    "Vous attendez quoi ? Un permis de démolir signé par le maire ?",
  ],
  milestone: {
    25: "Un quart du quartier. Les assureurs commencent à transpirer.",
    50: "La moitié. Le reste va se sentir bien seul.",
    75: "Trois quarts. Là, même la carte IGN va devoir être mise à jour.",
    90: "Quatre-vingt-dix pour cent. Il reste quoi ? Des souvenirs et des cailloux.",
  },
  first: {
    'Vitrerie': ["Le verre. Des façades entières. Ça fait un bruit de fin du monde, en plus aigu."],
    'Coffre-fort': ["Des lingots ! Voilà ce qu'on appelle un investissement qui s'effondre.", "Le coffre est ouvert. Les petits épargnants apprécieront l'ironie."],
    'Aéronautique': ["Un avion en moins. La compagnie parlera d'un « incident technique ».", "Le long-courrier ne décollera pas. Il vient d'être déclassé en court-bouillon."],
    'Ferroviaire': ["Un TGV. Le seul train qui arrive en morceaux avant même d'être parti.", "La SNCF vous prie de l'excuser pour la gêne occasionnée. Par vous."],
    'Véhicules': ["Une voiture. Le constat amiable va être très, très peu amiable."],
    'Réacteur': ["Le cœur du réacteur. Le compteur Geiger vient de démissionner.", "Vous avez touché au réacteur. Les voisins vont briller dans le noir."],
    'Déchets radioactifs': ["Les fûts jaunes. Personne n'en voulait ; maintenant, ils sont partout."],
    'Terrassement': ["On creuse. Le sous-sol aussi a le droit de prendre l'air."],
    'Électronique': ["Des écrans. Maintenant, ils affichent la même chose que la bourse : du noir."],
    'Bagages': ["Les bagages. Ils n'arriveront pas à destination. Comme d'habitude, en somme."],
    'Enseignes': ["L'enseigne lumineuse. On éteint en partant, c'est la moindre des politesses."],
  },
  collapse: [
    "Et voilà. Quand la base part, le reste suit. C'est la loi de la gravité, pas la mienne.",
    "Effondrement. Le mot préféré des experts en bâtiment. Et le mien.",
    "Ça tombe. Tout seul, comme un grand. On n'a même pas eu besoin de pousser.",
  ],
  explosion: [
    "Boum. Comme dirait l'autre : c'était un bâtiment porteur. De mauvaises nouvelles.",
    "Ça, c'est une explosion de joie. De la nôtre, en tout cas.",
    "Les vitres des trois rues d'à côté vous remercient.",
  ],
  nukeArmed: [
    "Elle est posée. Je vous conseille de marcher vite. Dans l'autre sens.",
    "Le compte à rebours est lancé. Personne ne l'arrêtera, et surtout pas moi.",
  ],
  nuke: [
    "Voilà. Un tiers du quartier. Le cadastre va devoir sortir la gomme.",
    "Le champignon est servi. Pour le dessert, on verra.",
    "Il y avait un quartier ici. Il y a désormais une vue dégagée.",
  ],
  dozer: [
    "Le bulldozer. Vingt tonnes d'arguments, et la lame pour conclure.",
    "Au volant du bulldozer. Le code de la route ne prévoit rien pour ça. Tant mieux.",
  ],
  nappe: [
    "De l'eau ! Vous avez creusé jusqu'à la nappe phréatique. Le service des eaux va adorer.",
    "Tiens, une source. On va pouvoir ouvrir des thermes. Enfin, un trou avec de l'eau dedans.",
    "La nappe phréatique. Plus bas, c'est la roche-mère, et elle, on ne la casse pas. Elle a des principes.",
  ],
  water: ["La mer. Elle récupère tout ce qu'on lui jette. Et elle ne rend rien."],
  mineMax: ["Huit mines, c'est le maximum autorisé par la convention. Faites-en sauter une avant."],
  timeUp: [
    "Terminé. Le quartier respire. Enfin, ce qu'il en reste.",
    "C'est l'heure. Posez les outils, les assureurs arrivent.",
  ],
  comboLabels: ['', '', 'Échauffement', 'Ça chauffe', 'Carnage', 'Démolition', 'Cataclysme', 'Apocalypse', 'Fin du monde', 'Big Bang', 'Bourrinator'],
  ranks: [
    { min: 0, title: 'Stagiaire en démolition', quote: 'On a vu des pigeons faire plus de dégâts. Et ils ne sont pas payés.' },
    { min: 50000, title: 'Casseur du dimanche', quote: 'Un bon début. Le genre de dégâts qui fait parler les voisins.' },
    { min: 250000, title: 'Bourrin confirmé', quote: 'Le syndic va convoquer une assemblée générale extraordinaire.' },
    { min: 1000000, title: 'Démolisseur agréé', quote: 'Un million. Les bulldozers de la ville vous envoient leur CV.' },
    { min: 3000000, title: 'Fléau urbain', quote: 'On vous étudiera à l\'école d\'architecture. Au chapitre « ce qu\'il ne faut pas ».' },
    { min: 6000000, title: 'Catastrophe naturelle', quote: 'Les assurances ont classé votre passage en catastrophe naturelle. Vous êtes un phénomène.' },
    { min: 10000000, title: 'Fin du monde (locale)', quote: 'Il n\'y a plus de quartier. Il n\'y a plus de sol. Il n\'y a plus que vous. Bravo.' },
  ],
};
