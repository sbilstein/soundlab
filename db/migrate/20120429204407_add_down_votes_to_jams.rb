class AddDownVotesToJams < ActiveRecord::Migration
  def change
    add_column :jams, :down_votes, :integer
  end
end
