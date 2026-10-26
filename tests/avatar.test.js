import {test} from 'node:test';import assert from 'node:assert/strict';
import {validAvatar,validPassword} from '../supabase/functions/knight-admin/account-values.js';
import {pixel,webp} from './fixtures/avatar.js';
test('avatar accepts a raster thumbnail or explicit removal, rejects external URLs, SVG and forged MIME types',()=>{
 assert(validAvatar(pixel));assert(validAvatar(webp));assert(validAvatar(''));
 for(const value of ['https://example.com/icon.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/jpeg;base64,'+pixel.split(',')[1],pixel+'" onerror="alert(1)',null,{},'data:image/png;base64,'+'A'.repeat(131072)])assert(!validAvatar(value));
});
test('password creation/reset requires exactly six characters',()=>{
 assert(validPassword('aB3!e6'));assert(validPassword('123456'));
 for(const value of ['12345','1234567','',null,123456])assert(!validPassword(value));
});
