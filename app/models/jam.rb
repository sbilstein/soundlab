class Jam < ActiveRecord::Base
  attr_accessible :song, :title, :up_votes, :down_votes
  default_scope :order => 'up_votes DESC'
  validates :title, :song, presence: true
    
end
