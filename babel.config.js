module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './', // @ aponta para a raiz do projeto
        },
      }],
      'expo-router/babel',
      'react-native-reanimated/plugin', // mantenha por último se estiver usando
    ],
  };
};
