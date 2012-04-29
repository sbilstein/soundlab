class Jam < ActiveRecord::Base
  attr_accessible :song, :title, :up_votes, :down_votes
  default_scope :order => 'up_votes DESC'
  validates :title, :song, presence: true
  before_save :default_values
  def default_values
    self.up_votes = 0
    self.down_votes = 0
  end
end
