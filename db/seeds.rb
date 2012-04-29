# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

jams =  Jam.create([
      {
       title: 'test1',
       up_votes: 7,
       down_votes: 3  
      },
      {
       title: 'test2',
       up_votes: 3, 
       down_votes: 9  
       },
       { title: 'test3',
         up_votes: 5,
         down_votes: 5  
       }
  ])