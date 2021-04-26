const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult} = require('express-validator')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

router.get('/me', auth, async (req, res) => {
    try {
        const profile =  await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])

        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user'})
        }

        res.json(profile)
    } catch (e) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        ...rest
      } = req.body;
  
      const profileFields = {
        user: req.user.id,
        website:
          website && website !== ''
            ? normalize(website, { forceHttps: true })
            : '',
        skills: Array.isArray(skills)
          ? skills
          : skills.split(',').map((skill) => ' ' + skill.trim()),
        ...rest
      };
  
      const socialFields = { youtube, twitter, instagram, linkedin, facebook };
  
      for (const [key, value] of Object.entries(socialFields)) {
        if (value && value.length > 0)
          socialFields[key] = normalize(value, { forceHttps: true });
      }
      profileFields.social = socialFields;
  
      try {
        let profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
      }
    }
  );


router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server error")
    }
})

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar'])

        if(!profile) return res.status(400).json({ msg: 'Profile not found'})
        res.json(profile)
    } catch (error) {
        console.log(error.message)
        if(error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found'})
        }
        res.status(500).send("Server error")
    }
})

router.delete('/', auth, async (req, res) => {
  try {
      await Profile.findOneAndRemove({ user: req.user.id})

      await User.findOneAndRemove({ _id: req.user.id})

      res.json({ msg: 'User deleted'})
  } catch (error) {
      console.log(error.message)
      res.status(500).send("Server error")
  }
})


module.exports = router
