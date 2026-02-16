export const PET_IMAGES = {
  'wolf-pup': {
    idle: require('../../assets/pets/endurance-wolf/wolf-pup.png'),
    celebrating: require('../../assets/pets/endurance-wolf/wolf-pup-celebrating.png'),
    sleeping: require('../../assets/pets/endurance-wolf/wolf-pup-sleeping.png'),
    waiting: require('../../assets/pets/endurance-wolf/wolf-pup-waiting.png'),
  },
  'wolf-runner': {
    idle: require('../../assets/pets/endurance-wolf/wolf-runner.png'),
    celebrating: require('../../assets/pets/endurance-wolf/wolf-runner-celebrating.png'),
    sleeping: require('../../assets/pets/endurance-wolf/wolf-runner-resting.png'),
    waiting: require('../../assets/pets/endurance-wolf/wolf-runner-waiting.png'),
  },
  'wolf-alpha': {
    idle: require('../../assets/pets/endurance-wolf/wolf-alpha.png'),
    celebrating: require('../../assets/pets/endurance-wolf/wolf-alpha-celebrating.png'),
    sleeping: require('../../assets/pets/endurance-wolf/wolf-alpha-sleeping.png'),
    waiting: require('../../assets/pets/endurance-wolf/wolf-alpha-waiting.png'),
  },
};

export type PetImageMood = keyof (typeof PET_IMAGES)['wolf-pup'];
